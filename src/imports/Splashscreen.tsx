import svgPaths from "./svg-w7z1gypv6v";
import imgRectangle7 from "figma:asset/d2dc082de376809efe9160821f9df7f46005e136.png";

function Battery() {
  return (
    <div className="absolute inset-[39.39%_3.82%_34.85%_89.69%]" data-name="Battery">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24.328 11.3333">
        <g id="Battery">
          <rect height="10.3333" id="Border" opacity="0.35" rx="2.16667" stroke="var(--stroke-0, white)" width="21" x="0.5" y="0.5" />
          <path d={svgPaths.p9ed9280} fill="var(--fill-0, white)" id="Cap" opacity="0.4" />
          <rect fill="var(--fill-0, white)" height="7.33333" id="Capacity" rx="1.33333" width="18" x="2" y="2" />
        </g>
      </svg>
    </div>
  );
}

function BarsStatusBarIPhoneTimeLight() {
  return (
    <div className="absolute inset-[15.91%_80%_36.36%_5.6%]" data-name="Bars / Status Bar / iPhone / Time - Light">
      <p className="absolute font-['Poppins:SemiBold',sans-serif] leading-[normal] left-0 not-italic right-0 text-[15px] text-center text-white top-[calc(50%-3.5px)] tracking-[-0.3px] whitespace-pre-wrap">09:41</p>
    </div>
  );
}

function BarsStatusBarIPhoneLight() {
  return (
    <div className="-translate-x-1/2 bg-[#0b0e14] h-[44px] pointer-events-auto sticky top-0 w-[375px]" data-name="Bars / Status Bar / iPhone / Light">
      <Battery />
      <div className="absolute inset-[39.39%_11.64%_35.61%_84.27%]" data-name="Wifi">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.333 10.9999">
          <path d={svgPaths.p39712400} fill="var(--fill-0, white)" id="Wifi" />
        </svg>
      </div>
      <div className="absolute inset-[40.15%_17.07%_35.61%_78.4%]" data-name="Cellular Connection">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 10.667">
          <path d={svgPaths.p26d17600} fill="var(--fill-0, white)" id="Cellular Connection" />
        </svg>
      </div>
      <BarsStatusBarIPhoneTimeLight />
    </div>
  );
}

function MaskGroup() {
  return (
    <div className="absolute contents left-[-19px] top-[-55.03px]" data-name="Mask group">
      <div className="absolute bg-white h-[311.209px] left-[-32.1px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[13.104px_17.69px] mask-size-[259.45px_259.45px] top-[-72.72px] w-[290.244px]" style={{ maskImage: `url('${imgRectangle7}')` }} />
    </div>
  );
}

function Frame() {
  return (
    <div className="h-[148.07px] overflow-clip relative shrink-0 w-[221.45px]">
      <MaskGroup />
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-center justify-center min-h-px min-w-px relative">
      <Frame />
      <p className="font-['SF_Pro:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[16px] text-center text-white tracking-[-0.3px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        Personal Autonomy Protocol
      </p>
    </div>
  );
}

function Text() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Text">
      <p className="font-['SF_Pro:Medium',sans-serif] font-[510] leading-[20px] relative shrink-0 text-[14px] text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
        Get Started
      </p>
    </div>
  );
}

function Buttons() {
  return (
    <div className="bg-[#ff6a00] content-stretch flex flex-col items-center justify-center px-[16px] py-[12px] relative rounded-[10px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)] shrink-0 w-[326.55px]" data-name="Buttons">
      <Text />
    </div>
  );
}

function Container() {
  return (
    <div className="-translate-x-1/2 absolute content-stretch flex flex-col gap-[24px] h-[768px] items-center justify-center left-[calc(50%-0.23px)] p-[24px] top-[44px] w-[374.55px]" data-name="Container">
      <Frame1 />
      <Buttons />
    </div>
  );
}

export default function Splashscreen() {
  return (
    <div className="bg-[#0b0e14] relative size-full" data-name="Splashscreen">
      <div className="absolute bottom-0 h-[812px] left-1/2 pointer-events-none top-0">
        <BarsStatusBarIPhoneLight />
      </div>
      <Container />
    </div>
  );
}