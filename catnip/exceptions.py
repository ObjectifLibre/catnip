class KeystoneAuthException(Exception):
    """Generic error class to identify and catch our own errors."""


class KeystoneTokenExpiredException(KeystoneAuthException):
    """The authentication token issued by the Identity service has expired."""


class KeystoneNoBackendException(KeystoneAuthException):
    """No backend could be determined to handle the provided credentials."""


class KeystoneNoProjectsException(KeystoneAuthException):
    """You are not authorized for any projects or domains."""


class KeystoneRetrieveProjectsException(KeystoneAuthException):
    """Unable to retrieve authorized projects."""


class KeystoneRetrieveDomainsException(KeystoneAuthException):
    """Unable to retrieve authorized domains."""


class KeystoneConnectionException(KeystoneAuthException):
    """Unable to establish connection to keystone endpoint."""


class KeystoneCredentialsException(KeystoneAuthException):
    """Invalid credentials."""


class KeystonePassExpiredException(KeystoneAuthException):
    """The password is expired and needs to be changed."""


class CloudkittyAPIClientException(Exception):
    """Generic error class to identify and catch cloukitty api
    client errors."""


class CatnipBadEnvironmentException(Exception):
    """Error class to identify catnip initialisation errors."""
