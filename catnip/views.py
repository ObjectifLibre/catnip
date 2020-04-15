import json
import uuid
import pkg_resources
import subprocess
from itertools import islice
from django.conf import settings
from django.http import HttpResponse, HttpResponseRedirect
from django.contrib import auth as django_auth
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.mixins import PermissionRequiredMixin
from django.shortcuts import render
from django.utils.decorators import method_decorator
from django.views import View
from keystoneauth1 import exceptions as keystone_exceptions
from catnip import forms
from catnip import user as auth_user
from catnip import backend as auth_backend
from catnip import exceptions


def get_catnip_backend(request):
    backend_path = request.session[django_auth.BACKEND_SESSION_KEY]
    backend = django_auth.load_backend(backend_path)
    return backend


def version() -> str:
    try:
        return "v" + str(pkg_resources.get_distribution("catnip").version)
    except Exception as e:
        # get git version
        ver = (
            subprocess.check_output(["git", "describe"])
            .decode()
            .strip()
            .split("-")
        )

        # Stable
        if len(ver) == 1:
            return ver[0]

        major, minor, point = ver[0].split(".")
        return f"{major}.{minor}.{int(point)+1}-dev{ver[1]}"


def get_context_view(request, view_name):
    context = {
        "api_version": int(settings.CLOUDKITTY_API_VERSION),
        "auth_type": settings.AUTH_TYPE,
        "version": version(),
        "view_name": view_name,
        "theme": request.COOKIES.get("theme", "default"),
    }
    if request.user and request.user.is_authenticated:
        # if user is logged in we need to add some fields to context view
        context["is_project_admin"] = request.user.is_project_admin
        context["user_name"] = request.user.username
    return context


class LoginView(View):
    template_name = "registration/login.html"
    next_url = settings.LOGIN_REDIRECT_URL
    view_name = "Login"

    def get(self, request):
        # check if env variables are set
        if not settings.CLOUDKITTY_API_VERSION or not settings.AUTH_URL:
            raise exceptions.CatnipBadEnvironmentException(
                "env variables OS_AUTH_URL or OS_RATING_API_VERSION aren't set"
            )
        if (
            settings.AUTH_TYPE != "cloudkitty-noauth"
            and settings.AUTH_TYPE != "keystone"
        ):
            raise exceptions.CatnipBadEnvironmentException(
                "env variable OS_AUTH_TYPE undefined or unknow."
            )
        # Due to VueJS router, api urls can appear as next urls
        # To avoid a redirection on api url, we redirect on LOGIN_REDIRECT_URL
        if "next" in request.GET and "/api/" not in request.GET["next"]:
            self.next_url = request.GET["next"]
        if request.user.is_authenticated:
            return HttpResponseRedirect(self.next_url)

        context = get_context_view(request, self.view_name)
        context["next_url"] = self.next_url
        return render(request, self.template_name, context)

    def post(self, request):
        if "?next=" in request.get_full_path():
            url_requested = request.get_full_path().split("?next=")[1]
            if url_requested and "/api/" not in url_requested:
                self.next_url = url_requested
        if settings.AUTH_TYPE == "cloudkitty-noauth":
            user_id = uuid.uuid4().hex
            noauth_user = auth_user.User(
                user_id=user_id, user="noauth-user", noauth=True
            )
            login(request, noauth_user)
            return HttpResponseRedirect(self.next_url)
        elif settings.AUTH_TYPE == "keystone":
            form = forms.AuthForm(request.POST)
            if form.is_valid():
                try:
                    user = authenticate(
                        request,
                        username=request.POST["username"],
                        password=request.POST["password"],
                        domain=request.POST["domain"],
                    )
                    if user is not None:
                        login(request, user)
                        if user.is_authenticated:
                            auth_user.set_session_from_user(request, user)
                            return HttpResponseRedirect(self.next_url)
                    error_message = "Authentification failed."
                except (
                    exceptions.KeystoneConnectionException,
                    exceptions.KeystoneNoProjectsException,
                ) as e:
                    error_message = str(e)
            else:
                error_message = "Form is invalid"
            context = get_context_view(request, self.view_name)
            context["error"] = error_message
            return render(request, self.template_name, context)


class LogoutView(View):
    def get(self, request):
        logout(request)
        auth_user.unset_session_from_user(request)
        return HttpResponseRedirect(settings.LOGIN_URL)


@method_decorator(login_required, name="get")
@method_decorator(login_required, name="post")
class ProjectsAPI(View):
    def get(self, request):
        # If AUTH_TYPE is no-auth we return an empty dict
        response = {}
        if settings.AUTH_TYPE == "keystone":
            # If user logs in when keystone is starting, all projects may not
            # be found. User can reload project list if needed.
            if "reload" in request.GET and request.GET["reload"] == "true":
                backend = get_catnip_backend(request)
                token = request.user.unscoped_token
                # user_token contains user keystone authentification
                # informations
                user_token = json.loads(request.session["token"])
                project_id = user_token["project"]["id"]
                scoped_auth = backend.get_scoped_auth(
                    unscoped_token=token, project_id=project_id
                )
                session = backend.get_session()
                scoped_auth_ref = scoped_auth.get_access(session)
                projects = backend.list_projects(
                    scoped_auth, auth_ref=scoped_auth_ref
                )
                backend.set_projects_in_session(request, projects)
            if "project_list" in request.session:
                response = {"project_list": request.session["project_list"]}
            else:
                response = []
        json_response = json.dumps(response)
        return HttpResponse(json_response, content_type="application/json")

    def post(self, request):
        if settings.AUTH_TYPE == "keystone":
            body_unicode = request.body.decode("utf-8")
            body_params = json.loads(body_unicode)
            body_params = {k: v for k, v in body_params.items() if v}

            if "project_id" in body_params:
                backend_path = request.session[django_auth.BACKEND_SESSION_KEY]
                backend = django_auth.load_backend(backend_path)
                try:
                    project = backend.switch_project(
                        request, body_params["project_id"]
                    )
                    return HttpResponse(
                        "Successfully switched to " + project["name"]
                    )
                except keystone_exceptions.ClientException:
                    return HttpResponse(
                        "Failed to switch to project id : "
                        + body_params["tenant_id"],
                        status=400,
                    )
            return HttpResponse(
                "Missing tenant_id in request body", status=400
            )
        return HttpResponse(
            "Available only for keystone authentication", status=400
        )


@method_decorator(login_required, name="get")
class ApplicationView(View):
    template_name = "index.html"
    view_name = "Catnip"

    def get(self, request):
        context = get_context_view(request, self.view_name)
        return render(request, self.template_name, context)


@method_decorator(login_required, name="get")
class SummaryAPI(View):
    def get_summary_data(self, client, params):
        try:
            return client.summary.get_summary(**params)
        except Exception as e:
            raise exceptions.CloudkittyAPIClientException(e)

    def format_data_chart(self, response, params):
        index_value = response["columns"].index("qty")
        index_date = response["columns"].index("begin")
        params["groupby"].remove("time")
        res = {}
        res["chart_names"] = []
        res["chart_data"] = {}
        for i in range(len(response["results"])):
            result = response["results"][i]
            date = result[index_date]
            value = result[index_value]
            if date not in res["chart_data"]:
                res["chart_data"][date] = {}
            if len(params["groupby"]):
                name = " ".join(
                    list(
                        map(
                            lambda x: result[response["columns"].index(x)],
                            params["groupby"],
                        )
                    )
                )
            else:
                name = "Summary"
            if name not in res["chart_names"]:
                res["chart_names"].append(name)
            res["chart_data"][date][name] = value
        res["chart_data"] = sorted(
            res["chart_data"].items(), key=lambda x: x[0]
        )
        return res

    def chunks(self, data, threshold):
        size = len(data) // threshold
        if size < 1:
            size = 1
        it = iter(data)
        for i in range(0, len(data), size):
            yield {k[0]: k[1] for k in islice(it, size)}

    def cumulative(self, dataset):
        cumulative_data = {}
        cumulative_date = ""
        for timestamp in dataset:
            if len(cumulative_date) == 0:
                cumulative_date = timestamp
            for name, value in dataset[timestamp].items():
                if name in cumulative_data:
                    cumulative_data[name] += value
                else:
                    cumulative_data[name] = value
        return {"key": cumulative_date, "value": cumulative_data}

    def aggregate_data(self, dataset, threshold, agg_func):
        agg_data = {}
        for data_chunk in self.chunks(dataset, threshold):
            ret_data = agg_func(data_chunk)
            last_key = ret_data["key"]
            agg_data[ret_data["key"]] = ret_data["value"]
        if len(dataset) % threshold != 0:
            del agg_data[last_key]
        return agg_data

    def get_summary_chart_data(self, client, params):
        # groupby time is mandatory in order to get charts' data
        if "groupby" not in params:
            params["groupby"] = "time"
        elif "time" not in params["groupby"]:
            params["groupby"] += ",time"

        params["limit"] = 1
        try:
            response = self.get_summary_data(client, params)

            # No data found, return empty dict
            if response["total"] == 0:
                return {}
            params["limit"] = response["total"]
            response = client.summary.get_summary(**params)
        except exceptions.CloudkittyAPIClientException:
            raise
        params["groupby"] = params.get("groupby").split(",")
        response = self.format_data_chart(response, params)
        threshold = 100
        if "threshold" in params:
            threshold = int(params["threshold"])
        response["chart_data"] = self.aggregate_data(
            response["chart_data"], threshold, self.cumulative
        )
        return response

    def get(self, request):
        params = {k: v for k, v in request.GET.items() if v}
        if "filters" in params:
            params["filters"] = json.loads(params.get("filters"))
        client = auth_backend.get_client(request.session)
        # Manage pagination
        if "page" in params and int(params["page"]) > 0:
            page = int(params["page"])
        else:
            page = 1
        if "limit" not in params:
            params["limit"] = settings.DEFAULT_PAGINATION_LIMIT
        params["offset"] = int(params["limit"]) * (page - 1)
        try:
            if ("chart" in params) and params["chart"] == "true":
                response = self.get_summary_chart_data(client, params)
            else:
                response = self.get_summary_data(client, params)
        except exceptions.CloudkittyAPIClientException as e:
            return HttpResponse(str(e), status=500)
        json_response = json.dumps(response)
        return HttpResponse(json_response, content_type="application/json")


@method_decorator(login_required, name="get")
@method_decorator(login_required, name="delete")
@method_decorator(login_required, name="put")
class HashmapServiceAPI(PermissionRequiredMixin, View):
    permission_required = "is_project_admin"

    def handle_no_permission(self):
        return HttpResponse("Permission denied", status=401)

    def get(self, request):
        params = {k: v for k, v in request.GET.items() if v}
        try:
            response = auth_backend.get_client(
                request.session
            ).rating.hashmap.get_service(**params)
        except Exception as e:
            return HttpResponse(str(e), status=500)
        json_response = json.dumps(response)
        return HttpResponse(json_response, content_type="application_json")

    def delete(self, request):
        try:
            body_unicode = request.body.decode("utf-8")
            body_params = json.loads(body_unicode)
            response = auth_backend.get_client(
                request.session
            ).rating.hashmap.delete_service(**body_params)
            return HttpResponse(response, content_type="text/plain")
        except Exception as e:
            error_message = "Failed to delete service: " + str(e)
            return HttpResponse(
                error_message, content_type="text/plain", status=400
            )

    def put(self, request):
        try:
            body_unicode = request.body.decode("utf-8")
            body_params = json.loads(body_unicode)
            body_params = {k: v for k, v in body_params.items() if v}
            response = auth_backend.get_client(
                request.session
            ).rating.hashmap.create_service(**body_params)
            json_response = json.dumps(response)
            return HttpResponse(json_response, content_type="application/json")
        except Exception as e:
            error_message = "Failed to create service: " + str(e)
            return HttpResponse(
                error_message, content_type="text/plain", status=400
            )


@method_decorator(login_required, name="get")
@method_decorator(login_required, name="delete")
@method_decorator(login_required, name="put")
class HashmapFieldAPI(PermissionRequiredMixin, View):
    permission_required = "is_project_admin"

    def handle_no_permission(self):
        return HttpResponse("Permission denied", status=401)

    def get(self, request):
        params = {k: v for k, v in request.GET.items() if v}
        response = auth_backend.get_client(
            request.session
        ).rating.hashmap.get_field(**params)
        json_response = json.dumps(response)
        return HttpResponse(json_response, content_type="application_json")

    def delete(self, request):
        try:
            body_unicode = request.body.decode("utf-8")
            body_params = json.loads(body_unicode)
            response = auth_backend.get_client(
                request.session
            ).rating.hashmap.delete_field(**body_params)
            return HttpResponse(response, content_type="text/plain")
        except Exception as e:
            error_message = "Failed to delete field: " + str(e)
            return HttpResponse(
                error_message, content_type="text/plain", status=400
            )

    def put(self, request):
        try:
            body_unicode = request.body.decode("utf-8")
            body_params = json.loads(body_unicode)
            body_params = {k: v for k, v in body_params.items() if v}
            response = auth_backend.get_client(
                request.session
            ).rating.hashmap.create_field(**body_params)
            json_response = json.dumps(response)
            return HttpResponse(json_response, content_type="application/json")
        except Exception as e:
            error_message = "Failed to create field: " + str(e)
            return HttpResponse(
                error_message, content_type="text/plain", status=400
            )


@method_decorator(login_required, name="get")
@method_decorator(login_required, name="delete")
@method_decorator(login_required, name="put")
class HashmapGroupAPI(PermissionRequiredMixin, View):
    permission_required = "is_project_admin"

    def handle_no_permission(self):
        return HttpResponse("Permission denied", status=401)

    def get(self, request):
        params = {k: v for k, v in request.GET.items() if v}
        try:
            response = auth_backend.get_client(
                request.session
            ).rating.hashmap.get_group(**params)
        except Exception as e:
            return HttpResponse(str(e), status=500)
        json_response = json.dumps(response)
        return HttpResponse(json_response, content_type="application_json")

    def delete(self, request):
        try:
            body_unicode = request.body.decode("utf-8")
            body_params = json.loads(body_unicode)
            response = auth_backend.get_client(
                request.session
            ).rating.hashmap.delete_group(**body_params)
            return HttpResponse(response, content_type="text/plain")
        except Exception as e:
            error_message = "Failed to delete group: " + str(e)
            return HttpResponse(
                error_message, content_type="text/plain", status=400
            )

    def put(self, request):
        try:
            body_unicode = request.body.decode("utf-8")
            body_params = json.loads(body_unicode)
            body_params = {k: v for k, v in body_params.items() if v}
            response = auth_backend.get_client(
                request.session
            ).rating.hashmap.create_group(**body_params)
            json_response = json.dumps(response)
            return HttpResponse(json_response, content_type="application/json")
        except Exception as e:
            error_message = "Failed to create group: " + str(e)
            return HttpResponse(
                error_message, content_type="text/plain", status=400
            )


@method_decorator(login_required, name="get")
@method_decorator(login_required, name="delete")
@method_decorator(login_required, name="put")
class HashmapMappingAPI(PermissionRequiredMixin, View):
    permission_required = "is_project_admin"

    def handle_no_permission(self):
        return HttpResponse("Permission denied", status=401)

    def get(self, request):
        params = {k: v for k, v in request.GET.items() if v}
        try:
            response = auth_backend.get_client(
                request.session
            ).rating.hashmap.get_mapping(**params)
        except Exception as e:
            return HttpResponse(str(e), status=500)
        json_response = json.dumps(response)
        return HttpResponse(json_response, content_type="application_json")

    def delete(self, request):
        try:
            body_unicode = request.body.decode("utf-8")
            body_params = json.loads(body_unicode)
            response = auth_backend.get_client(
                request.session
            ).rating.hashmap.delete_mapping(**body_params)
            return HttpResponse(response, content_type="text/plain")
        except Exception as e:
            error_message = "Failed to delete mapping: " + str(e)
            return HttpResponse(
                error_message, content_type="text/plain", status=400
            )

    def put(self, request):
        try:
            body_unicode = request.body.decode("utf-8")
            body_params = json.loads(body_unicode)
            body_params = {k: v for k, v in body_params.items() if v}
            response = auth_backend.get_client(
                request.session
            ).rating.hashmap.create_mapping(**body_params)
            json_response = json.dumps(response)
            return HttpResponse(json_response, content_type="application/json")
        except Exception as e:
            error_message = "Failed to create mapping: " + str(e)
            return HttpResponse(
                error_message, content_type="text/plain", status=400
            )


@method_decorator(login_required, name="get")
@method_decorator(login_required, name="delete")
@method_decorator(login_required, name="put")
class HashmapThresholdAPI(PermissionRequiredMixin, View):
    permission_required = "is_project_admin"

    def handle_no_permission(self):
        return HttpResponse("Permission denied", status=401)

    def get(self, request):
        params = {k: v for k, v in request.GET.items() if v}
        try:
            response = auth_backend.get_client(
                request.session
            ).rating.hashmap.get_threshold(**params)
        except Exception as e:
            return HttpResponse(str(e), status=500)
        json_response = json.dumps(response)
        return HttpResponse(json_response, content_type="application_json")

    def delete(self, request):
        try:
            body_unicode = request.body.decode("utf-8")
            body_params = json.loads(body_unicode)
            response = auth_backend.get_client(
                request.session
            ).rating.hashmap.delete_threshold(**body_params)
            return HttpResponse(response, content_type="text/plain")
        except Exception as e:
            error_message = "Failed to delete threshold: " + str(e)
            return HttpResponse(
                error_message, content_type="text/plain", status=400
            )

    def put(self, request):
        try:
            body_unicode = request.body.decode("utf-8")
            body_params = json.loads(body_unicode)
            response = auth_backend.get_client(
                request.session
            ).rating.hashmap.create_threshold(**body_params)
            json_response = json.dumps(response)
            return HttpResponse(json_response, content_type="application/json")
        except Exception as e:
            error_message = "Failed to create threshold: " + str(e)
            return HttpResponse(
                error_message, content_type="text/plain", status=400
            )


@method_decorator(login_required, name="get")
@method_decorator(login_required, name="post")
class RatingModulesAPI(PermissionRequiredMixin, View):
    permission_required = "is_project_admin"

    def handle_no_permission(self):
        return HttpResponse("Permission denied", status=401)

    def get(self, request):
        try:
            response = auth_backend.get_client(
                request.session
            ).rating.get_module()
        except Exception as e:
            return HttpResponse(str(e), status=500)
        json_response = json.dumps(response)
        return HttpResponse(json_response, content_type="application_json")

    def post(self, request):
        try:
            body_unicode = request.body.decode("utf-8")
            body_params = json.loads(body_unicode)
            body_params = {
                k: v for k, v in body_params.items() if v or k == "enabled"
            }
            response = auth_backend.get_client(
                request.session
            ).rating.update_module(**body_params)
            json_response = json.dumps(response)
            return HttpResponse(json_response, content_type="application/json")
        except Exception as e:
            error_message = "Failed to update rating modules: " + str(e)
            return HttpResponse(
                error_message, content_type="text/plain", status=400
            )


@method_decorator(login_required, name="get")
class ScopeAPI(PermissionRequiredMixin, View):
    permission_required = "is_project_admin"

    def handle_no_permission(self):
        return HttpResponse("Permission denied", status=401)

    def get(self, request):
        params = {k: v for k, v in request.GET.items() if v}
        try:
            response = auth_backend.get_client(
                request.session
            ).scope.get_scope_state(**params)
            json_response = json.dumps(response)
            return HttpResponse(
                json_response, content_type="application_json; charset=utf-8"
            )
        except Exception as e:
            error_message = str(e)
            return HttpResponse(error_message, status=500)
