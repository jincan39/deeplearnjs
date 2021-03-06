/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import {NDArrayMathCPU} from '../../math/math_cpu';
import {Array1D, Scalar} from '../../math/ndarray';
import {Tensor} from '../graph';
import {SummedTensorArrayMap, TensorArrayMap} from '../tensor_array_map';

import {Divide} from './divide';

describe('divide operation', () => {
  let math: NDArrayMathCPU;

  let x1Tensor: Tensor;
  let x2Tensor: Tensor;
  let yTensor: Tensor;
  let divideOp: Divide;
  let activations: TensorArrayMap;
  let gradients: SummedTensorArrayMap;

  beforeEach(() => {
    math = new NDArrayMathCPU();
    activations = new TensorArrayMap();
    gradients = new SummedTensorArrayMap(math);
  });

  afterEach(() => {
    activations.disposeArray(x1Tensor);
    activations.disposeArray(x2Tensor);
    activations.disposeArray(yTensor);
    gradients.disposeArray(x1Tensor);
    gradients.disposeArray(x2Tensor);
    gradients.disposeArray(yTensor);
  });

  it('element wise divide', () => {
    const x1 = Array1D.new([1, 2, 3]);
    const x2 = Array1D.new([2, 4, 6]);

    x1Tensor = new Tensor(x1.shape);
    x2Tensor = new Tensor(x2.shape);
    yTensor = new Tensor(x2.shape);

    activations.set(x1Tensor, x1);
    activations.set(x2Tensor, x2);

    divideOp = new Divide(x1Tensor, x2Tensor, yTensor);
    divideOp.feedForward(math, activations);

    const y = activations.get(yTensor);
    expect(y.get(0)).toBeCloseTo(1 / 2);
    expect(y.get(1)).toBeCloseTo(2 / 4);
    expect(y.get(2)).toBeCloseTo(3 / 6);

    const dy = Array1D.new([3, 4, 5]);
    gradients.add(yTensor, dy);

    divideOp.backProp(math, activations, gradients);

    const dx1 = gradients.get(x1Tensor);
    expect(dx1.get(0)).toBeCloseTo(dy.get(0) / x2.get(0));
    expect(dx1.get(1)).toBeCloseTo(dy.get(1) / x2.get(1));
    expect(dx1.get(2)).toBeCloseTo(dy.get(2) / x2.get(2));

    const dx2 = gradients.get(x2Tensor);
    expect(dx2.get(0))
        .toBeCloseTo(-1 * x1.get(0) * dy.get(0) * Math.pow(x2.get(0), -2));
    expect(dx2.get(1))
        .toBeCloseTo(-1 * x1.get(1) * dy.get(1) * Math.pow(x2.get(1), -2));
    expect(dx2.get(2))
        .toBeCloseTo(-1 * x1.get(2) * dy.get(2) * Math.pow(x2.get(2), -2));
  });

  it('scalar divided by ndarray', () => {
    const x1 = Scalar.new(2);
    const x2 = Array1D.new([2, 4, 6]);

    x1Tensor = new Tensor(x1.shape);
    x2Tensor = new Tensor(x2.shape);
    yTensor = new Tensor(x2.shape);

    activations.set(x1Tensor, x1);
    activations.set(x2Tensor, x2);

    divideOp = new Divide(x1Tensor, x2Tensor, yTensor);
    divideOp.feedForward(math, activations);

    const y = activations.get(yTensor);
    expect(y.get(0)).toBeCloseTo(2 / 2);
    expect(y.get(1)).toBeCloseTo(2 / 4);
    expect(y.get(2)).toBeCloseTo(2 / 6);

    const dy = Array1D.new([3, 4, 5]);
    gradients.add(yTensor, dy);

    divideOp.backProp(math, activations, gradients);

    const dx1 = gradients.get(x1Tensor).asScalar();
    expect(dx1.get()).toBeCloseTo(
        dy.get(0) / x2.get(0) + dy.get(1) / x2.get(1) + dy.get(2) / x2.get(2));

    const dx2 = gradients.get(x2Tensor);
    expect(dx2.get(0))
        .toBeCloseTo(-1 * x1.get() * dy.get(0) * Math.pow(x2.get(0), -2));
    expect(dx2.get(1))
        .toBeCloseTo(-1 * x1.get() * dy.get(1) * Math.pow(x2.get(1), -2));
    expect(dx2.get(2))
        .toBeCloseTo(-1 * x1.get() * dy.get(2) * Math.pow(x2.get(2), -2));
  });

  it('ndarray divided by scalar', () => {
    const x1 = Array1D.new([2, 4, 6]);
    const x2 = Scalar.new(2);

    x1Tensor = new Tensor(x1.shape);
    x2Tensor = new Tensor(x2.shape);
    yTensor = new Tensor(x2.shape);

    activations.set(x1Tensor, x1);
    activations.set(x2Tensor, x2);

    divideOp = new Divide(x1Tensor, x2Tensor, yTensor);
    divideOp.feedForward(math, activations);

    const y = activations.get(yTensor);
    expect(y.get(0)).toBeCloseTo(2 / 2);
    expect(y.get(1)).toBeCloseTo(4 / 2);
    expect(y.get(2)).toBeCloseTo(6 / 2);

    const dy = Array1D.new([3, 4, 5]);
    gradients.add(yTensor, dy);

    divideOp.backProp(math, activations, gradients);

    const dx1 = gradients.get(x1Tensor);
    expect(dx1.get(0)).toBeCloseTo(dy.get(0) / x2.get());
    expect(dx1.get(1)).toBeCloseTo(dy.get(1) / x2.get());
    expect(dx1.get(2)).toBeCloseTo(dy.get(2) / x2.get());

    const dx2 = gradients.get(x2Tensor).asScalar();
    expect(dx2.get()).toBeCloseTo(
        -1 * x1.get(0) * dy.get(0) * Math.pow(x2.get(), -2) +
        -1 * x1.get(1) * dy.get(1) * Math.pow(x2.get(), -2) +
        -1 * x1.get(2) * dy.get(2) * Math.pow(x2.get(), -2));
  });
});
