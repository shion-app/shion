package main

import (
	"golang.org/x/exp/constraints"
)

type Operator = string

type CompareOption[T constraints.Ordered] struct {
	a  T
	b  T
	op Operator
}

const (
	gte Operator = "gte"
	gt  Operator = "gt"
	lte Operator = "lte"
	lt  Operator = "lt"
)

func Compare[T constraints.Ordered](c CompareOption[T]) (bool, error) {
	a, b, op := c.a, c.b, c.op
	switch op {
	case gte:
		return a >= b, nil
	case gt:
		return a > b, nil
	case lte:
		return a <= b, nil
	case lt:
		return a < b, nil
	default:
		return false, illegalOperator
	}
}
