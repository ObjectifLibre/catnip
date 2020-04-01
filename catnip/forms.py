from django import forms


class AuthForm(forms.Form):
    domain = forms.CharField(label='Your domain', max_length=250)
    username = forms.CharField(label='Your name', max_length=250)
    password = forms.CharField(label='Your password', max_length=250)
