#!/bin/sh

export OS_AUTH_URL=http://cloudkitty-api:8889
export OS_AUTH_TYPE=cloudkitty-noauth
export OS_RATING_API_VERSION=2

./manage.py test
