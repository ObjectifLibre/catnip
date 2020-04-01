from catnip import backend


backend.patch_middleware_get_user()


class AuthPatchMiddleware(object):
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Do nothing actually
        return self.get_response(request)
