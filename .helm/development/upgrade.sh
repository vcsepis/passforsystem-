#!/bin/bash

BASE_RELEASE_NAME=paas-dev

# upgrade postgresql
helm upgrade --install -f services/postgresql/values.yaml $BASE_RELEASE_NAME-postgresql services/postgresql
helm upgrade --install -f services/redis/values.yaml $BASE_RELEASE_NAME-redis services/redis
helm upgrade --install -f services/porter/values.yaml $BASE_RELEASE_NAME-porter services/porter
helm upgrade --install -f services/webpack/values.yaml $BASE_RELEASE_NAME-webpack services/webpack
