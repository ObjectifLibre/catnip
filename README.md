# Catnip

<p align="center">
    <img width="250" src="https://raw.githubusercontent.com/ObjectifLibre/catnip/master/catnip/static/pictures/catnip_logo.png"/>
</p>
<p align="center">
    Standalone Dashboard for <a href="https://github.com/openstack/cloudkitty">Cloudkitty</a>
</p>


Catnip is an alternative to [Cloudkitty-Dashboard](https://github.com/openstack/cloudkitty-dashboard) and can be used outside of an Openstack environment.
With Catnip, operators can easily define a rating policy for their cloud without the use of a CLI. Users can get information about their usage, and predict costs of an instance.
In addition to cloudkitty-dashboard, users can filter on summary, summary-charts, scopes to get easily the information that they are looking for.

Dependencies
------------

Catnip uses the following dependencies

- Uikit v3: https://github.com/uikit/uikit
- VueJS: https://github.com/vuejs/vue
- VueJS Router: https://github.com/vuejs/vue-router
- Font Awesome: https://github.com/FortAwesome/Font-Awesome

Other Information
-----------------

Catnip uses [cloudkitty api](https://docs.openstack.org/cloudkitty/latest/api-reference/index.html) v2. If you are using v1, lots of features will be blocked.


Environment Variables
---------------------

You need to set the following environment variables to have catnip works as expected:

 - **OS_AUTH_URL**: the url where catnip will try to log in. If the authentication type is _cloudkitty-noauth_, it will be the cloudkitty-api url. Else if it's a _keystone_ authentication, it will be the keystone url.
 - **OS_RATING_VERSION**: the version of the cloudkitty-api you are using. Must be a string.
 - **OS_AUTH_TYPE**: the authentication type you are using. Can be _keystone_ or _cloudkitty-noauth_


Installation
------------
###  Git

Clone project
```
git clone https://github.com/ObjectifLibre/catnip
```

Install python libraries
```
pip install -r requirements.txt
```

Set environment variables
```
export OS_AUTH_URL=<AUTHENTICATION_URL>
export OS_RATING_API_VERSION=<CLOUDKITTY_API_VERSION>
export OS_AUTH_TYPE=<OS_AUTH_TYPE>
```

Migrate django models
```
python manage.py migrate
```

Collect static files
```
python manage.py collectstatic
```

Start catnip
```
python manage.py runserver <IP>:<PORT>
```

### Docker

You can direcly use the catnip image : https://hub.docker.com/repository/docker/objectiflibre/catnip

Dockerfile example:
```
FROM objectiflibre/catnip

ENV OS_AUTH_URL="http://keystone:5000/v3"
ENV OS_RATING_API_VERSION="2"
ENV OS_AUTH_TYPE=keystone

RUN cd /catnip \
        && python3 manage.py collectstatic --noinput \
        && python3 manage.py migrate

ENTRYPOINT python manage.py runserver 0.0.0.0:8900
```

Screenshots
-----------
#### Summary Charts (dark mode)
<p align="center">
    <img src="https://raw.githubusercontent.com/ObjectifLibre/catnip/master/screenshots/summary-charts.png"/>
</p>

#### Rating Modules (light mode)
<p align="center">
    <img src="https://raw.githubusercontent.com/ObjectifLibre/catnip/master/screenshots/rating-modules.png"/>
</p>

#### Hashmap (dark mode)
<p align="center">
    <img src="https://raw.githubusercontent.com/ObjectifLibre/catnip/master/screenshots/hashmap.png"/>
</p>
