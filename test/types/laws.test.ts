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

import * as jv from "jsverify"
import * as laws from "../laws"
import { Box, BoxInstances } from "./box"
import {
  eqOf, Eq, Applicative, applicativeOf,
  getTypeClassInstance,
  registerTypeClassInstance
} from "../../src/types"

const arbBox = jv.number.smap(n => new Box(n), b => b.value)

describe("Default Eq ops obey laws", () => {
  laws.testEq(Box, arbBox)
})

describe("Default Functor ops obey laws", () => {
  laws.testFunctor(Box, arbBox, eqOf(Box))
})

describe("Default Apply ops obey laws", () => {
  laws.testApply(Box, arbBox, t => new Box(t), eqOf(Box))
})

describe("Default Applicative ops obey laws", () => {
  laws.testApplicative(Box, arbBox, eqOf(Box))
})

describe("Type class registration", () => {
  it("should not throw error if registering the same instance", () => {
    const ap = applicativeOf(Box)
    registerTypeClassInstance(Applicative)(Box, ap)
  })

  it("should throw error if registering type class multiple times", () => {
    try {
      registerTypeClassInstance(Applicative)(Box, new BoxInstances())
    } catch (e) {
      expect(e.name).toBe("IllegalArgumentError")
    }
  })

  it("should throw error if type class isn't implemented", () => {
    try {
      getTypeClassInstance(Eq)(String)
    } catch (e) {
      expect(e.name).toBe("NotImplementedError")
    }
  })
})
