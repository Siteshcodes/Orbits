import { Particles } from "./ui/particles";

export default function SpaceParticles() {
  return (
    <div className="relative bg-black w-full h-screen overflow-hidden">
      <Particles
        color="#ffffff"
        particleCount={25000}
        particleSize={5}
        animate={false}
        className="z-0"
      />
    </div>
  );
}
