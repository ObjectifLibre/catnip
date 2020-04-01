import logging
import json
from datetime import datetime
from functools import lru_cache
from django.conf import settings
from django.contrib import auth as django_auth
from django.contrib.auth import models
from django.contrib.auth import middleware
from keystoneauth1.identity import v3
from keystoneauth1 import session as ks_session
from keystoneauth1 import exceptions as ks_exceptions
from keystoneclient.v3 import client as ks_client
from cloudkittyclient import auth as ck_auth
from cloudkittyclient import client as ck_client
from catnip import user as auth_user
from catnip import exceptions


LOG = logging.getLogger(__name__)


def middleware_get_user(request):
    if not hasattr(request, "_cached_user"):
        request._cached_user = get_user(request)
    return request._cached_user


def get_user(request):
    try:
        user_id = request.session[django_auth.SESSION_KEY]
        backend_path = request.session[django_auth.BACKEND_SESSION_KEY]
        backend = django_auth.load_backend(backend_path)
        backend.request = request
        user = backend.get_user(user_id) or models.AnonymousUser()
    except KeyError:
        user = models.AnonymousUser()
    return user


def patch_middleware_get_user():
    middleware.get_user = middleware_get_user
    django_auth.get_user = get_user


@lru_cache(maxsize=128)
def get_client(session):
    if settings.AUTH_TYPE == "cloudkitty-noauth":
        auth = ck_auth.CloudKittyNoAuthPlugin(endpoint=settings.AUTH_URL)
        client = ck_client.Client(settings.CLOUDKITTY_API_VERSION, auth=auth)
        return client
    elif settings.AUTH_TYPE == "keystone":
        token_as_dict = json.loads(session["token"])
        if token_as_dict["project"]["id"]:
            auth = v3.Token(
                auth_url=settings.AUTH_URL,
                token=token_as_dict["unscoped_token"],
                project_id=token_as_dict["project"]["id"],
                reauthenticate=False,
            )
        else:
            auth = v3.Token(
                auth_url=settings.AUTH_URL,
                token=token_as_dict["unscoped_token"],
                user_project_name=token_as_dict["user_domain_name"],
                reauthenticate=False,
            )
        session = ks_session.Session(auth=auth)
        client = ck_client.Client("2", session=session)
        return client
    return None


class CatnipAuthenticationBackend:
    """ Catnip authentication backend """

    def get_unscoped_auth(self, username=None, password=None, domain=None):
        return v3.Password(
            auth_url=settings.AUTH_URL,
            user_domain_name=domain,
            username=username,
            password=password,
            unscoped=True,
        )

    def get_scoped_auth(self, unscoped_token, project_id):
        scoped_auth = v3.Token(
            auth_url=settings.AUTH_URL,
            token=unscoped_token,
            project_id=project_id,
            reauthenticate=False,
        )
        return scoped_auth

    def set_projects_in_session(self, request, projects):
        project_list = {}
        for project in projects:
            project_list[project.id] = project.name
        request.session["project_list"] = project_list

    def list_projects(self, auth, auth_ref=None):
        try:
            session = self.get_session()
            client = ks_client.Client(session=session, auth=auth)
            if auth_ref.is_federated:
                projects = client.federation.projects.list()
            else:
                projects = client.projects.list(user=auth_ref.user_id)
            return [project for project in projects if project.enabled]
        except (
            ks_exceptions.ClientException,
            ks_exceptions.AuthorizationFailure,
        ):
            msg = "Unable to retrieve authorized projects."
            raise exceptions.KeystoneRetrieveProjectsException(msg)

    def get_project_scoped_auth(self, unscoped_auth_ref, projects):
        scoped_auth = None
        scoped_auth_ref = None
        session = self.get_session()
        for project in projects:
            unscoped_token = unscoped_auth_ref.auth_token
            scoped_auth = self.get_scoped_auth(
                unscoped_token, project_id=project.id
            )
            try:
                scoped_auth_ref = scoped_auth.get_access(session)
            except (
                ks_exceptions.ClientException,
                ks_exceptions.AuthorizationFailure,
            ):
                LOG.info(
                    "Attempted scope to project %s failed, will attempt "
                    "to scope to another project.",
                    project.name,
                )
            else:
                break
        return scoped_auth, scoped_auth_ref

    def list_domains(self, auth, domain_name):
        if domain_name:
            return [domain_name]
        try:
            session = self.get_session()
            client = ks_client.Client(session=session, auth=auth)
            domains = client.auth.domains()
            return [domain.name for domain in domains if domain.enabled]
        except (
            ks_exceptions.ClientException,
            ks_exceptions.AuthorizationFailure,
        ):
            msg = "Unable to retrieve authorized domains."
            raise exceptions.KeystoneRetrieveDomainsException(msg)

    def get_domain_scoped_auth(self, unscoped_auth_ref, domains):
        domain_auth = None
        domain_auth_ref = None
        session = self.get_session()
        for domain in domains:
            token = unscoped_auth_ref.auth_token
            domain_auth = v3.Token(
                auth_url=settings.AUTH_URL,
                token=token,
                domain_name=domain,
                reauthentificate=False,
            )
            try:
                domain_auth_ref = domain_auth.get_access(session)
            except (
                ks_exceptions.ClientException,
                ks_exceptions.AuthorizationFailure,
            ):
                LOG.info(
                    "Attempted scope to domain %s failed, will attempt "
                    "to scope to another domain.",
                    domain,
                )
            else:
                if len(domains) > 1:
                    LOG.info(
                        "More than one valid domain found for user %s,"
                        " scoping to %s",
                        unscoped_auth_ref.user_id,
                        domain,
                    )
                break
        return domain_auth, domain_auth_ref

    def get_session(self, **kwargs):
        return ks_session.Session(verify=False, **kwargs)

    def authenticate(self, request, username=None, password=None, domain=None):
        try:
            unscoped_auth = self.get_unscoped_auth(username, password, domain)
            session = self.get_session()
            unscoped_auth_ref = unscoped_auth.get_access(session)
        except ks_exceptions.ConnectFailure:
            msg = "Unable to establish connection to keystone endpoint."
            raise exceptions.KeystoneConnectionException(msg)
        try:
            projects = self.list_projects(unscoped_auth, unscoped_auth_ref)
            scoped_auth, scoped_auth_ref = self.get_project_scoped_auth(
                unscoped_auth_ref, projects
            )
            if not scoped_auth_ref:
                # if the user can't obtain a project scoped token, set the
                # scoped token to be the domain token, if valid
                domains = self.list_domains(unscoped_auth, domain)
                scoped_auth, scoped_auth_ref = self.get_domain_scoped_auth(
                    unscoped_auth_ref, domains
                )
            if not scoped_auth_ref:
                msg = "You are not authorized for any projects or domains."
                raise exceptions.KeystoneNoProjectsException(msg)
        except exceptions.KeystoneRetrieveProjectsException:
            raise
        auth_token = auth_user.Token(
            scoped_auth_ref, unscoped_auth_ref.auth_token
        )
        user = auth_user.create_user_from_token(request, auth_token)
        if request is not None:
            request.user = user
            self.set_projects_in_session(request, projects)
        return user

    def switch_project(self, request, project_id):
        session = self.get_session()
        unscoped_token = request.user.unscoped_token
        scoped_auth = v3.Token(
            auth_url=settings.AUTH_URL,
            token=unscoped_token,
            project_id=project_id,
        )
        try:
            scoped_auth_ref = scoped_auth.get_access(session)
            auth_token = auth_user.Token(scoped_auth_ref, unscoped_token)
            user = auth_user.create_user_from_token(request, auth_token)
            auth_user.set_session_from_user(request, user)
            LOG.info(
                "Switch to project '%(project_name)s' successful.",
                {"project_name": request.user.project_name},
            )
            return auth_token.project
        except ks_exceptions.ClientException:
            LOG.error(
                "Failed to switch to project id '%(project_id)s'",
                {"project_id": project_id},
            )
            raise

    def get_user(self, user_id):
        if settings.AUTH_TYPE == "cloudkitty-noauth":
            user = auth_user.User(
                user_id=user_id, user="noauth-user", noauth=True
            )
            return user
        if settings.AUTH_TYPE == "keystone":
            if (
                hasattr(self, "request")
                and user_id == self.request.session["user_id"]
            ):
                token_as_dict = json.loads(self.request.session["token"])
                token_as_dict["expires"] = datetime.strptime(
                    token_as_dict["expires"], "%m/%d/%Y, %H:%M:%S"
                )
                token = auth_user.Token(None)
                token.set_data(**token_as_dict)
                user = auth_user.create_user_from_token(self.request, token)
                return user
        return None
