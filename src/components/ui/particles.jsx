import { useEffect, useRef } from "react";
import * as THREE from "three";

export function Particles({
  color = "#ff3366",
  particleCount = 10000,
  particleSize = 35,
  animate = true,
  className = "",
}) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let camera;
    let scene;
    let material;
    let animationFrameId;
    let mouseX = 0;
    let mouseY = 0;

    const init = () => {
      camera = new THREE.PerspectiveCamera(
        55,
        window.innerWidth / window.innerHeight,
        2,
        2000
      );
      camera.position.z = 1000;

      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x000000, 0.001);

      const geometry = new THREE.BufferGeometry();
      const vertices = [];

      for (let i = 0; i < particleCount; i++) {
        vertices.push(
          2000 * Math.random() - 1000,
          2000 * Math.random() - 1000,
          2000 * Math.random() - 1000
        );
      }

      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(vertices, 3)
      );

      const sprite = new THREE.TextureLoader().load(
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAAZiS0dEAAAAAAAA+UO7fwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB9sHDgwCEMBJZu0AAAAdaVRYdENvbW1lbnQAAAAAAENyZWF0ZWQgd2l0aCBHSU1QZC5lBwAABM5JREFUWMO1V0tPG2cUPZ4Hxh6DazIOrjFNqJs0FIMqWFgWQkatsmvVbtggKlSVRVf5AWz4AWz4AUSKEChll19QJYSXkECuhFxsHjEhxCYm+DWGMZ5HF72DJq4bAzFXurI0M/I5997v3u9cC65vTJVn2lX/xHINQOYSBLTLEuIuCWw4Z3IGAEvf6ASmVHjNzHCXBG4A0AjACsAOwEbO0nsFQBnAGYASAIl+ZRMR7SolMEdsByD09fV5R0ZGgg8ePPjW5/N1iqLYpuu6RZblciKR2I9Go69evnwZnZ+fjwI4IS8AKBIRzeQfJWCANwKwh0KhtrGxsYehUOin1tbW+zzP23ietzY2NnIAoGmaLsuyUiqVyvl8XtrY2NiamZn589mzZxsAUgCOAeQAnFI2tI+VxIjaAeDzoaGh7xYWFuZOTk6OZVk+12uYqqq6JEnn0Wg0OT4+/geAXwGEAdwDIFJQXC1wO4DWR48e/RFCxxclSSroVzRFUbSDg4P848ePFwH8DuAhkWih83TRQWxFOXgAwvDwcOfo6OhvXV1d39tsNtuVBwTDWBwOh1UUxVsMw1hXVlbSdCgNV43uYSvrHg6H24aHh38eHBz85TrgF9FYLHA4HLzH43FvbW2d7u/vG+dANp8FpqIlbd3d3V8Fg8EfBUGw4BONZVmL3+9vHhkZCQL4AoAHgJPK8G+yzC0XDofdoVAo5PP5vkadTBAEtr+/39ff3x8gAp/RPOEqx2qjx+NpvXv3bk9DQ0NDvQgwDIOWlhZrMBj8kgi0UJdxRgYMArzL5XJ7vd57qLPZ7Xamp6fnNgBXtQxcjFuHw+Hyer3t9SYgCAITCAScAJoBNNEY/08GOFVVrfVMv7kMNDntFD1vjIAPrlRN0xjckOm6biFQ3jwNPwDMZrOnqVTqfb3Bi8Wivru7W/VCYkwPlKOjo0IikXh7EwQikYgE4Nw0CfXKDCipVCoTj8df3QABbW1tLUc6oUgkFPMkVACUNjc337148eKvw8PDbJ2jP1taWkoCyNDVXDSECmNSK4qiKNLq6urW8+fPI/UicHx8rD59+jSVy+WOAKSJhKENwFItLtoxk8mwsixzHR0dHe3t7c5PAU+n09rs7OzJkydPYqVSaQfANoDXALIk31S2smU1TWMPDg7K5XKZ7+3t9TudTut1U7+wsFCcmJiIpdPpbQBxADsAknQWymYCOukBHYCuKApisdhpMpnURFEU79y503TVyKenpzOTk5M7e3t7MQKPV0Zv1gNm+awB0MvlshqLxfLb29uyJElWURSbXC4XXyvqxcXFs6mpqeTc3Nzu3t7e3wQcA7BPZ8Cour1pNWlqlmUtAG8MwHV6v95tAINA5MDBwPxAIuLu6upr8fr/VAN3c3JQjkcjZ+vp6fnl5+d2bN29SuVzuNYAEpf01CdRChUL+X1VskHACuA3Ay3Fcu9vt7nA6nZ7m5uYWQRCaNE3jVVW15PP580KhIGUymWw2m00DOAJwSP4WwPtq4LX2Ao6USxNlQyS/RcQcdLGwlNIz6vEMAaZNzCk2Pll94LK/cDYimxERiBwG10sxjgvEZBE0UpE6vxj+0Ct5bTaXthgEhRmja8QWNkkPGsuIpfdjpkK+cZUWTC0KredVmtD/gdlSl6EG4AMvQAAAABJRU5ErkJggg=="
      );
      material = new THREE.PointsMaterial({
        size: particleSize,
        sizeAttenuation: true,
        map: sprite,
        alphaTest: 0.5,
        transparent: true,
      });
      material.color.setStyle(color);

      const particles = new THREE.Points(geometry, material);
      scene.add(particles);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      container.appendChild(renderer.domElement);

      const onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };

      const onPointerMove = (event) => {
        if (event.isPrimary === false) return;
        mouseX = event.clientX - window.innerWidth / 2;
        mouseY = event.clientY - window.innerHeight / 2;
      };

      window.addEventListener("resize", onWindowResize);
      document.addEventListener("pointermove", onPointerMove);

      const animateLoop = () => {
        animationFrameId = requestAnimationFrame(animateLoop);
        if (animate) {
          const time = Date.now() * 0.00005;
          camera.position.x += (mouseX - camera.position.x) * 0.05;
          camera.position.y += (-mouseY - camera.position.y) * 0.05;
          camera.lookAt(scene.position);

          const h = ((360 * (1.0 + time)) % 360) / 360;
          material.color.setHSL(h, 0.5, 0.5);
        }
        renderer.render(scene, camera);
      };

      animateLoop();

      return () => {
        window.removeEventListener("resize", onWindowResize);
        document.removeEventListener("pointermove", onPointerMove);
        cancelAnimationFrame(animationFrameId);
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      };
    };

    const cleanup = init();

    return () => {
      if (cleanup) cleanup();
    };
  }, [color, particleCount, particleSize, animate]);

  return <div ref={mountRef} className={className} />;
}
