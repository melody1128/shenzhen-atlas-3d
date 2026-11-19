#!/bin/zsh
cd "${0:A:h}" || exit 1
/usr/bin/env npm run local:start
