THREE.HandDrawShader = {
  "hatch": {
    uniforms: {
      "fcolor": {
        value: new THREE.Color(0xffffff)
      }
    },
    vertexShader: [
      "precision highp float;",
      "varying vec3 fNormal;",
      "varying vec3 fPosition;",

      "void main() {",
        "fNormal = normalize(normalMatrix * normal);",
        "vec4 pos = modelViewMatrix * vec4(position, 1.0);",
        "fPosition = pos.xyz;",
        "gl_Position = projectionMatrix * pos;",
      "}",
    ].join("\n"),
    fragmentShader: [
      "precision highp float;",
      "varying vec3 fPosition;",
      "varying vec3 fNormal;",

      "void main() {",
        "gl_FragColor = vec4(fPosition, 1.0);",
      "}",
    ].join("\n")
  }
};
