#!/bin/bash

BASE_RELEASE_NAME=paas-dev

# install postgresql
helm install -f services/postgresql/values.yaml $BASE_RELEASE_NAME-postgresql services/postgresql
helm install -f services/redis/values.yaml $BASE_RELEASE_NAME-redis services/redis
helm install -f services/porter/values.yaml $BASE_RELEASE_NAME-porter services/porter
helm install -f services/webpack/values.yaml $BASE_RELEASE_NAME-webpack services/webpack
