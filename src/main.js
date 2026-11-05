import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js";
import { characters } from "./characters.js";

function makeMaterial(color, roughness = 0.78) {
  return new THREE.MeshStandardMaterial({ color, roughness });
}
function addMesh(parent, geometry, material, position, scale) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  if (scale) mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function createFighter(data, scene, x) {
  const group = new THREE.Group();
  group.position.x = x;
  group.scale.setScalar(data.height);
  scene.add(group);

  const skin = makeMaterial(data.skin);
  const hair = makeMaterial(data.hair);
  const jacket = makeMaterial(data.jacket);
  const shirt = makeMaterial(data.shirt);
  const pants = makeMaterial(data.pants);
  const shoe = makeMaterial(0xeee9e4);
  const dark = makeMaterial(0x211d24);
  const eyeWhite = makeMaterial(0xfafafa, 0.4);
  const iris = makeMaterial(0x211b18, 0.3);

  // Legs and shoes
  for (const side of [-1, 1]) {
    addMesh(group, new THREE.CapsuleGeometry(0.105, 0.48, 5, 10), pants, [side * 0.14, 0.56, 0], [1, 1, 1]);
    addMesh(group, new THREE.BoxGeometry(0.24, 0.12, 0.38), shoe, [side * 0.14, 0.12, 0.09]);
  }

  // Torso, shirt and open jacket panels
  addMesh(group, new THREE.CapsuleGeometry(0.27, 0.48, 6, 12), shirt, [0, 1.35, 0]);
  if (data.id === "bauna-kid") {
    for (const side of [-1, 1]) {
      addMesh(group, new THREE.BoxGeometry(0.16, 0.62, 0.34), jacket, [side * 0.205, 1.35, 0.015], [1, 1, 1]);
    }
  } else {
    addMesh(group, new THREE.CapsuleGeometry(0.285, 0.5, 6, 12), makeMaterial(data.jacket), [0, 1.35, -0.012]);
  }

  // Arms with a relaxed fighting guard
  const armPivots = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.29, 1.55, 0);
    group.add(pivot);
    addMesh(pivot, new THREE.CapsuleGeometry(0.085, 0.36, 4, 8), skin, [side * 0.10, -0.13, 0.10], [1, 1, 1]);
    addMesh(pivot, new THREE.SphereGeometry(0.105, 12, 10), skin, [side * 0.18, -0.28, 0.19]);
    pivot.rotation.z = side * -0.45;
    armPivots.push(pivot);
  }

  // Neck and head
  addMesh(group, new THREE.CylinderGeometry(0.09, 0.1, 0.18, 12), skin, [0, 1.78, 0]);
  const head = new THREE.Group();
  head.position.y = 2.04;
  group.add(head);
  addMesh(head, new THREE.SphereGeometry(0.29, 24, 20), skin, [0, 0, 0], [0.88, 1.05, 0.9]);
  // Hair cap and fringe
  addMesh(head, new THREE.SphereGeometry(0.285, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.53), hair, [0, 0.12, -0.015], [1, 0.72, 1]);
  addMesh(head, new THREE.BoxGeometry(0.34, 0.09, 0.14), hair, [0, 0.12, 0.22], [1, 1, 0.7]);

  // Eyes, brows, nose and a small stylized moustache
  for (const side of [-1, 1]) {
    addMesh(head, new THREE.SphereGeometry(0.045, 12, 10), eyeWhite, [side * 0.105, 0.025, 0.245], [1.15, 0.75, 0.45]);
    addMesh(head, new THREE.SphereGeometry(0.022, 10, 8), iris, [side * 0.105, 0.022, 0.281]);
    addMesh(head, new THREE.BoxGeometry(0.095, 0.025, 0.035), hair, [side * 0.105, 0.095, 0.245]);
  }
  addMesh(head, new THREE.SphereGeometry(0.035, 10, 8), skin, [0, -0.045, 0.265], [0.8, 1.3, 0.8]);
  addMesh(head, new THREE.BoxGeometry(0.16, 0.035, 0.025), dark, [0, -0.115, 0.265], [1, 0.7, 1]);

  // Lemon held near the second fighter's hip as a visual signature.
  if (data.accessories.lemon) {
    const lemon = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), makeMaterial(0xffd51d));
    lemon.scale.set(1.25, 0.85, 0.85);
    lemon.position.set(0.42, 1.08, 0.18);
    lemon.rotation.z = -0.3;
    lemon.castShadow = true;
    group.add(lemon);
  }

  return { group, head, armPivots };
}

function createPreview(canvasId, character, x, background) {
  const canvas = document.getElementById(canvasId);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = null;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 2.25, 6.8);
  camera.lookAt(0, 1.25, 0);

  scene.add(new THREE.HemisphereLight(0xdde7ff, 0x46334b, 2.0));
  const key = new THREE.DirectionalLight(0xffffff, 2.5);
  key.position.set(-3, 6, 5);
  key.castShadow = true;
  scene.add(key);
  const rim = new THREE.PointLight(background, 2.0, 10);
  rim.position.set(2, 3, -2);
  scene.add(rim);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(2.5, 48), makeMaterial(0x33344b));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.015;
  floor.receiveShadow = true;
  scene.add(floor);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.018, 8, 64), new THREE.MeshBasicMaterial({ color: background }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.03;
  scene.add(ring);

  const fighter = createFighter(character, scene, x);
  const clock = new THREE.Clock();
  let animatePose = false;

  function resize() {
    const width = canvas.clientWidth || 320;
    const height = canvas.clientHeight || 360;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  function render() {
    const t = clock.getElapsedTime();
    fighter.group.position.y = Math.sin(t * 2.0) * 0.025;
    fighter.group.rotation.y = Math.sin(t * 0.65) * 0.08;
    fighter.head.rotation.z = Math.sin(t * 1.7) * 0.025;
    if (animatePose) {
      fighter.armPivots[0].rotation.z = -0.85 + Math.sin(t * 8) * 0.15;
      fighter.armPivots[1].rotation.z = 0.85 - Math.sin(t * 8) * 0.15;
    } else {
      fighter.armPivots[0].rotation.z = 0.45;
      fighter.armPivots[1].rotation.z = -0.45;
    }
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }
  resize();
  render();
  return () => { animatePose = !animatePose; };
}

const poseOne = createPreview("fighter-one", characters[0], 0, 0xff4764);
const poseTwo = createPreview("fighter-two", characters[1], 0, 0x459cff);
document.getElementById("pose-button").addEventListener("click", () => {
  poseOne();
  poseTwo();
  const button = document.getElementById("pose-button");
  button.textContent = button.textContent.includes("PLAY") ? "RETURN TO IDLE" : "PLAY IDLE ANIMATION";
});
