#!/bin/bash
source /Users/juandiaz/para/para-backend.env
export PATH="/opt/homebrew/bin:$PATH"
cd /Users/juandiaz/Documents/final/WhatZatppa/packages/dev-env
exec node --enable-source-maps dist/bin.js
