package main

import "errors"

var bucketNotFound = errors.New(T("error.bucketNotFound"))

var illegalOperator = errors.New(T("error.illegalOperator"))

var needAddQueryCompare = errors.New(T("error.needAddQueryCompare"))
