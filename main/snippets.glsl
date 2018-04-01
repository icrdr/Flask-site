precision highp float;

varying vec3 vNormal;
varying vec3 mNormal;
varying vec3 mvNormal;

varying vec3 vPosition;
varying vec4 mPosition;
varying vec4 mvPosition;

void main() {
  vNormal = normal;
  mNormal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal);
  mvNormal = normalize( normalMatrix * normal );

  vPosition = position;
  mPosition = modelMatrix * vec4(position, 1.0);
  mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}
vec2 nUV = vec2(
  mod( gl_FragCoord.x, Resolution.x ) / Resolution.x,
  mod( gl_FragCoord.y, Resolution.y ) / Resolution.y
);
precision highp float;

varying vec3 vNormal;
varying vec3 mNormal;
varying vec3 mvNormal;

varying vec3 vPosition;
varying vec4 mPosition;
varying vec4 mvPosition;

void main() {
gl_FragColor = vec4(fposition.xyz, 1.0);
}

//漫反射
vec3 lightDir = normalize(pointLightposition - worldPosition.xyz);
float diff = max(0., dot(worldNormal, lightDir));
vec3 diffuse = diff * pointLightcolor;

//高光
vec3 viewDir = normalize(cameraPosition - worldPosition.xyz);
vec3 reflectDir = reflect(-lightDir, worldNormal);
float spec = pow(max(0., dot(viewDir, reflectDir)), shininess);
vec3 specular = spec * pointLightcolor;


vec2 rand(vec2 co){
    return vec2(
        fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453),
        fract(cos(dot(co.yx ,vec2(8.64947,45.097))) * 43758.5453)
    )*2.0-1.0;
}

float dots(vec2 offset, float size, float width, float seed, float grey)
{
    vec2 uv = (gl_FragCoord.xy ) * size + offset.xy;
    vec2 g = floor(uv);
    vec2 f = fract(uv) * 2.0 - 1.0;
    vec2 r = (vec2(
        fract(sin(dot(g.xy ,cameraPos.xy)) * seed),
        fract(cos(dot(g.yx ,cameraPos.xy)) * seed)
    )*2.0-1.0) * (1.0 - width);
    //return smoothstep(width, width*0.75, length(f+r));
    return length(f);
}

  vec3 stippling(vec3 color){
    float grey = max(color.r,max(color.b,color.g));
    vec2 nUV = vec2(
      mod( gl_FragCoord.x, Resolution.x ) / Resolution.x,
      mod( gl_FragCoord.y, Resolution.y ) / Resolution.y
    );

    float seedA = 2341123.4390;
    float seedB = 233123.4490;
    vec3 stepA = vec3(dots(vec2(.0), .05, 0.5, seedA, grey));
    vec3 t_color;

    t_color = stepA;
    return t_color;
  }
