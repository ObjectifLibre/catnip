from django.test import TestCase, Client
from django.conf import settings
from catnip import views


class SummaryTestCase(TestCase):
    valid_status_code_list = [200, 301]

    def setUp(self):
        # Every test needs a client.
        self.client = Client()

    def test_logout_view(self):
        # log in user
        self.client.post("/dashboard/login/", secure=True)

        response = self.client.get("/dashboard/logout/", secure=True)
        self.assertRedirects(response, settings.LOGIN_URL)

    def test_login_user(self):
        # Log in no-auth user
        response = self.client.post("/dashboard/login/", secure=True)
        self.assertRedirects(response, settings.LOGIN_REDIRECT_URL)

    def test_login_view(self):
        response = self.client.get("/dashboard/login/", secure=True)
        self.assertTemplateUsed(response, views.LoginView.template_name)
