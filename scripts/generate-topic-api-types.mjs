import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

const contractUrl = new URL("../docs/handout/topic-learning/api.openapi.yaml", import.meta.url);
const outputUrl = new URL("../src/features/topic/types/topic-api.types.ts", import.meta.url);
export function renderTypes(spec) {
  const schemas = spec.components.schemas;
  function render(schema, indent = "") {
    if (schema.$ref) {
      const name = schema.$ref.split("/").at(-1);
      if (!schemas[name]) throw new Error("Unknown schema: " + name);
      return name;
    }
    if ("const" in schema) return JSON.stringify(schema.const);
    if (schema.enum) return schema.enum.map(value => JSON.stringify(value)).join(" | ");
    if (schema.anyOf || schema.oneOf) return (schema.anyOf ?? schema.oneOf).map(value => render(value, indent)).join(" | ");
    if (schema.type === "null") return "null";
    if (schema.type === "string") return "string";
    if (schema.type === "integer" || schema.type === "number") return "number";
    if (schema.type === "boolean") return "boolean";
    if (schema.type === "array") return "Array<" + render(schema.items, indent) + ">";
    if (schema.type === "object") {
      const required = new Set(schema.required ?? []);
      const properties = Object.entries(schema.properties ?? {}).map(([key, value]) =>
        indent + "  " + JSON.stringify(key) + (required.has(key) ? "" : "?") + ": " + render(value, indent + "  ") + ";"
      );
      return "{\n" + properties.join("\n") + "\n" + indent + "}";
    }
    throw new Error("Unsupported schema: " + JSON.stringify(schema));
  }
  return "// Generated from docs/handout/topic-learning/api.openapi.yaml.\n// Run npm run topic:types after editing the contract.\n\n" +
    Object.entries(schemas).map(([name, schema]) => "export type " + name + " = " + render(schema) + ";\n").join("\n");
}
export async function checkContract() {
  const spec = JSON.parse(await readFile(contractUrl, "utf8"));
  if (spec.openapi !== "3.1.0") throw new Error("OpenAPI 3.1.0 required");
  const operations = new Set();
  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      if (operations.has(operation.operationId)) throw new Error("Duplicate operationId");
      operations.add(operation.operationId);
      for (const match of path.matchAll(/\{(\w+)\}/g)) {
        if (!operation.parameters.some(parameter => parameter.in === "path" && parameter.name === match[1] && parameter.required)) throw new Error("Missing path parameter: " + path);
      }
      if (method === "post" && !operation.parameters.some(parameter => parameter.in === "header" && parameter.name === "Idempotency-Key" && parameter.required)) throw new Error("Mutation missing idempotency header");
    }
  }
  function checkRefs(value) {
    if (!value || typeof value !== "object") return;
    if (value.$ref) {
      let resolved = spec;
      if (!value.$ref.startsWith("#/")) throw new Error("External references are unsupported");
      for (const part of value.$ref.slice(2).split("/")) resolved = resolved?.[part];
      if (!resolved) throw new Error("Unresolved reference: " + value.$ref);
    }
    for (const child of Object.values(value)) checkRefs(child);
  }
  checkRefs(spec);
  return spec;
}
async function main() {
  const spec = await checkContract();
  const expected = renderTypes(spec);
  if (process.argv.includes("--check")) {
    const actual = await readFile(outputUrl, "utf8");
    if (actual.replace(/\r\n/g, "\n") !== expected) throw new Error("Wire types drifted; run npm run topic:types");
    console.log("Contract references, operation metadata and generated types match (" + Object.keys(spec.components.schemas).length + " schemas).");
  } else {
    await writeFile(outputUrl, expected, "utf8");
    console.log("Generated " + fileURLToPath(outputUrl));
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
