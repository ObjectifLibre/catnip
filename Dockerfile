FROM python:3.7-alpine

ENV PYTHONUNBUFFERED 1

WORKDIR /catnip/

COPY requirements.txt .

RUN apk add --no-cache gcc \
        libressl-dev \
        libffi-dev \
        musl-dev \
        git \
        && pip install -r requirements.txt \
        && apk del gcc libressl-dev libffi-dev musl-dev

COPY . .

RUN python setup.py sdist

ENTRYPOINT python manage.py runserver 0.0.0.0:80
