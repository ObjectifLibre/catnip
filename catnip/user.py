import json
from django.conf import settings
from django.contrib.auth import models as auth_models
from django.db import models
from django.utils import timezone
from datetime import timedelta


def set_session_from_user(request, user):
    token_as_dict = user.token.__dict__
    token_as_dict["expires"] = token_as_dict["expires"].strftime(
        "%m/%d/%Y, %H:%M:%S"
    )
    request.session["token"] = json.dumps(token_as_dict)
    request.session["user_id"] = user.cloudkitty_user_id
    # Update the user object cached in the request
    request._cached_user = user
    request.user = user


def unset_session_from_user(request):
    request.session["token"] = None
    request.session["user_id"] = None
    request._cached_user = None
    request.user = None


def create_user_from_token(request, token):
    if settings.AUTH_TYPE == "keystone":
        return User(
            user_id=token.user["id"],
            token=token,
            user=token.user["name"],
            password_expires_at=token.user["password_expires_at"],
            user_domain_id=token.user_domain_id,
            user_domain_name=getattr(token, "user_domain_name", None),
            project_id=token.project["id"],
            project_name=token.project["name"],
            domain_id=token.domain["id"],
            domain_name=token.domain["name"],
            enabled=True,
            noauth=False,
            is_federated=getattr(token, "is_federated", False),
            unscoped_token=token.unscoped_token,
        )
    return User()


class Token(object):
    """Encapsulates the AccessInfo object for cloudkitty-client."""

    def __init__(self, auth_ref, unscoped_token=None):
        if auth_ref:
            # User-related attributes
            user = {"id": auth_ref.user_id, "name": auth_ref.username}
            data = getattr(auth_ref, "_data", {})
            expiration_date = (
                data.get("token", {})
                .get("user", {})
                .get("password_expires_at")
            )
            user["password_expires_at"] = expiration_date
            self.user = user
            self.user_domain_name = auth_ref.user_domain_name
            self.user_domain_id = auth_ref.user_domain_id

            # Token-related attributes
            self.token_id = auth_ref.auth_token
            self.unscoped_token = unscoped_token
            self.expires = auth_ref.expires

            project = {}
            project["id"] = auth_ref.project_id
            project["name"] = auth_ref.project_name
            project["is_admin_project"] = getattr(
                auth_ref, "is_admin_project", False
            )
            project["domain_id"] = getattr(auth_ref, "project_domain_id", None)
            self.project = project
            self.tenant = self.project

            domain = {}
            domain["id"] = auth_ref.domain_id
            domain["name"] = auth_ref.domain_name
            self.domain = domain

    def set_data(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)


class User(auth_models.AbstractBaseUser, auth_models.AnonymousUser):
    cloudkitty_user_id = models.CharField(primary_key=True, max_length=255)
    USERNAME_FIELD = "cloudkitty_user_id"

    def __init__(
        self,
        user_id=None,
        token=None,
        user=None,
        password_expires_at=None,
        user_domain_id=None,
        user_domain_name=None,
        project_id=None,
        project_name=None,
        domain_id=None,
        domain_name=None,
        enabled=False,
        noauth=False,
        is_federated=False,
        unscoped_token=None,
    ):
        self.token = token
        self.username = user
        self.password_expires_at = password_expires_at
        self.cloudkitty_user_id = user_id
        self.user_domain_id = user_domain_id
        self.user_domain_name = user_domain_name
        self.project_id = project_id
        self.project_name = project_name
        self.domain_id = domain_id
        self.domain_name = domain_name
        self.enabled = enabled
        self.noauth = noauth
        self.is_federated = is_federated
        self.unscoped_token = unscoped_token

        # Required by AbstractBaseUser
        self.password = None

    def __unicode__(self):
        return self.username

    def __repr__(self):
        return "<%s: %s>" % (self.__class__.__name__, self.username)

    def is_token_valid(self, token):
        if token is None:
            return False
        expiration = token.expires
        if expiration is None:
            return False
        if timezone.is_naive(expiration):
            expiration = timezone.make_aware(expiration, timezone.utc)
        return expiration > timezone.now()

    @property
    def is_project_admin(self):
        if settings.AUTH_TYPE == "cloudkitty-noauth":
            return True
        if self.token:
            if "is_admin_project" in self.token.project:
                return self.token.project["is_admin_project"]
        return False

    @property
    def is_authenticated(self):
        """Checks for a valid authentication."""
        if self.noauth:
            return True
        return self.is_token_valid(self.token)

    @property
    def is_anonymous(self):
        """Return False if the user is not authenticated.
        :returns: ``True`` if not authenticated,``False`` otherwise.
        """
        return not self.is_authenticated

    # Override the default has_perms method.
    # Allows to have a permissions management based on the properties
    # of the user.
    def has_perms(self, perms_list, obj=None):
        """ Return True if all of the user properties contained in perms_list
        return True """
        if not perms_list:
            return False
        user_has_perm = True
        for perm in perms_list:
            user_has_perm = user_has_perm and getattr(self, perm, False)
        return user_has_perm

    @property
    def is_active(self):
        return self.enabled

    def get_username(self):
        return self.username

    def save(self, *args, **kwargs):
        pass

    def delete(self, *args, **kwargs):
        pass

    class Meta(object):
        app_label = "catnip"
