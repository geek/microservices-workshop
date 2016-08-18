#!/bin/sh

while :
do
    pkill -SIGTERM node && break
done
