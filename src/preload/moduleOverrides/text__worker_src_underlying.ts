import window from "globals/window";
import * as t from "@babel/types";
import moduleOverrides from "../workerOverrides";
import withDependencyMap, {
  DependencyNameMap,
} from "../overrideHelpers/withDependencyMap";

import { transform } from "@babel/standalone";

/*
Can't just paste newDefine and ALMOND_OVERRIDES from src/preload/script.ts a la:

  StringLiteral(path: babel.NodePath<t.StringLiteral>) {
    path.node.value = `(${injectedContent})();\n${path.node.value}`;
  },

because that would require building the entire override toolchain into injectedContent,
which would double bundle size because babel is the main bundle cost.

Instead, run babel transform on the string itself.
*/

export default () => ({
  StringLiteral(path: babel.NodePath<t.StringLiteral>) {
    /* @plugin core
    
    @what Replace the worker src string with a custom string
    */
    const src = path.node.value;
    const lines = [];
    for (let line of src.split("\n")) {
      if (line.startsWith("define(")) {
        lines.push(transformLine(line));
      } else {
        lines.push(line);
      }
    }
    path.node.value = lines.join("\n");
  },
});

const visitor = {
  CallExpression(path: babel.NodePath<t.CallExpression>) {
    const moduleName = path.node.arguments[0];
    const dependencies = path.node.arguments[1];
    const func = path.node.arguments[2];
    if (
      t.isIdentifier(path.node.callee, { name: "define" }) &&
      t.isStringLiteral(moduleName)
    ) {
      const visitorFunc = moduleOverrides[moduleName.value];
      if (
        visitorFunc !== undefined &&
        t.isArrayExpression(dependencies) &&
        t.isFunctionExpression(func)
      ) {
        const dependencyNameMap: DependencyNameMap = {};
        for (let i = 0; i < func.params.length; i++) {
          const param = func.params[i];
          if (!t.isIdentifier(param)) {
            throw "Expected module definition to consist entirely of identifiers";
          }
          const dep = dependencies.elements[i];
          if (!t.isStringLiteral(dep)) {
            throw "Expected dependencies to be exclusively strings";
          }
          dependencyNameMap[dep.value] = param;
        }
        path.traverse(visitorFunc(dependencyNameMap));
      }
    }
    // the define() CallExpression should be root-level, so skip no matter what
    path.skip();
  },
};

function transformLine(line: string) {
  return transform(line, {
    compact: true,
    plugins: [
      () => ({
        visitor: visitor,
      }),
    ],
  }).code;
}
