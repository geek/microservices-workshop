#!/bin/sh

while :
do
    pkill -SIGHUP node && break
done
