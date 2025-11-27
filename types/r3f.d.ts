import * as THREE from "three";
import { ThreeElements } from "@react-three/fiber";

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {
      mesh: ThreeElements["mesh"];
      ambientLight: ThreeElements["ambientLight"];
      directionalLight: ThreeElements["directionalLight"];
      planeGeometry: ThreeElements["planeGeometry"];
      boxGeometry: ThreeElements["boxGeometry"];
      circleGeometry: ThreeElements["circleGeometry"];
      ringGeometry: ThreeElements["ringGeometry"];
      meshStandardMaterial: ThreeElements["meshStandardMaterial"];
      meshBasicMaterial: ThreeElements["meshBasicMaterial"];
      shadowMaterial: ThreeElements["shadowMaterial"];
    }
  }
}