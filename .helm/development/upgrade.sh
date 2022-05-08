#!/bin/bash

BASE_RELEASE_NAME=paas-dev

# upgrade postgresql
helm upgrade -f services/postgresql/values.yaml $BASE_RELEASE_NAME-postgresql services/postgresql
helm upgrade -f services/redis/values.yaml $BASE_RELEASE_NAME-redis services/redis
