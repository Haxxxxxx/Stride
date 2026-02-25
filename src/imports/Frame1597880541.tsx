import imgRectangle7 from "figma:asset/dc33bf4dcbc192d6dda86d23d93b5f6dced4ef05.png";

function MaskGroup() {
  return (
    <div className="absolute contents left-[-18.69px] top-[-16.31px]" data-name="Mask group">
      <div className="absolute bg-white h-[87.023px] left-[-22.35px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[3.664px_4.947px] mask-size-[72.55px_72.55px] top-[-21.25px] w-[81.16px]" style={{ maskImage: `url('${imgRectangle7}')` }} />
    </div>
  );
}

export default function Frame() {
  return (
    <div className="relative size-full">
      <MaskGroup />
    </div>
  );
}