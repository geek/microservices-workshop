#!/bin/sh

# copied from: https://github.com/geek/workshop/blob/master/sales/reload.sh
# if we fire SIGHUP vs node before it has a chance to register the
# signal handler, then it will immediately exit. This ensures that
# the process is listening on port 8000 which should only be the
# case after we have the signal handler loaded.
while :
do
    netstat | grep -q 8000 && pkill -SIGHUP node && break
done
