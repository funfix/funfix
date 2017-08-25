/*
 * Copyright (c) 2017 by The Funfix Project Developers.
 * Some rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * `DynamicRef` provides a binding mechanism where the current value is
 * found through dynamic scope, but where access to the variable itself is
 * resolved through static scope.
 *
 * The current value can be retrieved with the {@link DynamicRef.get} method.
 * New values should be pushed using the {@link DynamicRef.bind} method.
 *
 * Values pushed via `bind` only stay valid while its second argument,
 * a parameterless function (the `thunk`), executes. When that thunk finishes
 * execution, the reference reverts to the previous value.
 *
 * See {@link DynamicRef.bind} for a usage sample.
 *
 * @final
 */
export class DynamicRef<A> {
  /** Previous states of the ref, to use in `revert`. */
  private _previous: (() => A)[] = []

  /** Returns the current value of this `DynamicRef`. */
  get: () => A

  private constructor(fn: () => A) {
    this.get = fn
  }

  /**
   * Updates the underlying of this `DynamicRef` to the given `value`.
   *
   * Note that the previous state can be reverted with
   * [revert]{@link DynamicRef.revert}:
   *
   * ```typescript
   * const ref = DynamicRef.of(() => "initial")
   *
   * ref.set("another")
   * ref.get() // another
   *
   * ref.revert()
   * ref.get() // initial
   * ```
   */
  set(value: A): void {
    return this.setL(() => value)
  }

  /**
   * Updates the underlying of this `DynamicRef` to values generated by the
   * given `thunk`.
   *
   * Note that the previous state can be reverted with
   * [revert]{@link DynamicRef.revert}:
   *
   * ```typescript
   * const ref = DynamicRef.of(() => "initial")
   *
   * ref.setL(() => "another")
   * ref.get() // another
   *
   * ref.revert()
   * ref.get() // initial
   * ```
   */
  setL(thunk: () => A): void {
    this._previous.push(this.get)
    this.get = thunk
  }

  /**
   * Reverts this `DynamicRef` to a previous state, if a previous
   * state is available due to calling [set]{@link DynamicRef.set} or
   * [setL]{@link DynamicRef.setL}.
   *
   * ```typescript
   * const ref = DynamicRef.of(() => "initial")
   *
   * ref.set("state 2")
   * ref.set("state 3")
   * ref.get() // Yields: state 3
   *
   * ref.revert()
   * ref.get() // Yields: state 2
   *
   * ref.revert()
   * ref.get() // Yields: initial
   *
   * ref.revert() // No-op
   * ref.get() // Yields: initial
   * ```
   */
  revert(): void {
    const thunk = this._previous.pop()
    if (thunk) this.get = thunk
  }

  /**
   * Binds this `DynamicRef` to a different (strict) `value` that's going to be
   * visible while executing `thunk` and then it will get reverted to
   * its previous value.
   *
   * Sample:
   *
   * ```typescript
   * const ref = DynamicRef.of(() => "original")
   *
   * ref.get() // original
   *
   * ref.bind("modified", () => {
   *   ref.get() // modified
   * })
   *
   * ref.get() // original
   * ```
   *
   * @see [bindL]{@link DynamicRef.bindL} for binding a non-strict value instead.
   *
   * @param value is the value to bind to this reference within `thunk`'s execution
   * @param thunk is a parameterless function to execute
   *
   * @return the result of executing `thunk`
   */
  bind<R>(value: A, thunk: () => R): R {
    return this.bindL(() => value, thunk)
  }

  /**
   * Binds this `DynamicRef` to a different (non-strict) `value` that's going
   * to be visible while executing `thunk` and then it will get reverted to
   * its previous value.
   *
   * Sample:
   *
   * ```typescript
   * const ref = DynamicRef.of(() => "original")
   *
   * ref.get() // original
   *
   * ref.bindL(() => "modified", () => {
   *   ref.get() // modified
   * })
   *
   * ref.get() // original
   * ```
   *
   * @see [bind]{@link DynamicRef.bindL} for binding a strict value instead.
   *
   * @param value is the value generator to bind to this reference within `thunk`'s execution
   * @param thunk is a parameterless function to execute
   *
   * @return the result of executing `thunk`
   */
  bindL<R>(value: () => A, thunk: () => R): R {
    const oldFn = this.get
    const oldPrev = this._previous.slice(0)
    const ta = this as any
    try {
      ta.get = value
      return thunk()
    } finally {
      ta.get = oldFn
      ta._previous = oldPrev
    }
  }

  /**
   * Builds a {@link DynamicRef}, where the given parameterless function
   * is going to be the generator for the default value of the returned
   *
   *
   */
  static of<A>(fn: () => A): DynamicRef<A> {
    return new DynamicRef(fn)
  }
}
