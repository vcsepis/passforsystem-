#!/bin/bash

# upgrade postgresql
helm upgrade -f postgresql.values.yaml paas-development .
