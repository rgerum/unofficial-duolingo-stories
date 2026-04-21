type LamejsEncoder = {
  encodeBuffer(left: Int16Array, right?: Int16Array): Int8Array;
  flush(): Int8Array;
};

type LamejsModule = {
  Mp3Encoder: new (
    channels: number,
    sampleRate: number,
    kbps: number,
  ) => LamejsEncoder;
};

type CjsModuleNamespace = {
  default?: unknown;
};

type LamejsDependencyLoader = readonly [
  globalName: string,
  load: () => Promise<unknown>,
];

const LAMEJS_GLOBAL_DEPENDENCIES: readonly LamejsDependencyLoader[] = [
  ["MPEGMode", () => import("lamejs/src/js/MPEGMode.js")],
  ["Lame", () => import("lamejs/src/js/Lame.js")],
  ["BitStream", () => import("lamejs/src/js/BitStream.js")],
  ["Encoder", () => import("lamejs/src/js/Encoder.js")],
  ["PsyModel", () => import("lamejs/src/js/PsyModel.js")],
  ["Takehiro", () => import("lamejs/src/js/Takehiro.js")],
  ["QuantizePVT", () => import("lamejs/src/js/QuantizePVT.js")],
  ["Reservoir", () => import("lamejs/src/js/Reservoir.js")],
  ["Tables", () => import("lamejs/src/js/Tables.js")],
  ["Version", () => import("lamejs/src/js/Version.js")],
  ["VBRTag", () => import("lamejs/src/js/VBRTag.js")],
  ["GainAnalysis", () => import("lamejs/src/js/GainAnalysis.js")],
] as const;

let lamejsModulePromise: Promise<LamejsModule> | null = null;

function unwrapCjsModule(module: unknown) {
  return (module as CjsModuleNamespace).default ?? module;
}

async function exposeLamejsGlobals() {
  for (const [globalName, loadModule] of LAMEJS_GLOBAL_DEPENDENCIES) {
    Reflect.set(globalThis, globalName, unwrapCjsModule(await loadModule()));
  }
}

export async function getLamejsModule() {
  if (!lamejsModulePromise) {
    lamejsModulePromise = (async () => {
      try {
        // The published `lamejs` entrypoint is broken because several internal
        // modules rely on undeclared globals that only exist in the bundled build.
        await exposeLamejsGlobals();
        return unwrapCjsModule(
          await import("lamejs/src/js/index.js"),
        ) as LamejsModule;
      } catch (error) {
        lamejsModulePromise = null;
        throw error;
      }
    })();
  }

  return lamejsModulePromise;
}
