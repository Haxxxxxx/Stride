import svgPaths from "./svg-i601bghja9";

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
    <div className="-translate-x-1/2 bg-[#061113] h-[44px] pointer-events-auto sticky top-0 w-[375px]" data-name="Bars / Status Bar / iPhone / Light">
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

function CaretLeft() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="CaretLeft">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="CaretLeft">
          <path d={svgPaths.p204a5580} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Placeholder() {
  return <div className="shrink-0 size-[24px]" data-name="placeholder" />;
}

function Header() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="header">
      <CaretLeft />
      <div className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center leading-[0] relative shrink-0 text-[16px] text-center text-white whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.2]">Step 5 of 11</p>
      </div>
      <Placeholder />
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex items-center justify-center px-[25px] py-[8px] relative rounded-[50px] shrink-0 w-[100px]">
      <div className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center leading-[0] relative shrink-0 text-[#9aa0a6] text-[11px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.5]">Pound</p>
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="bg-[#ff6a00] content-stretch flex items-center justify-center px-[25px] py-[8px] relative rounded-[50px] shrink-0 w-[100px]">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.1)] border-solid inset-0 pointer-events-none rounded-[50px]" />
      <div className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center leading-[0] relative shrink-0 text-[#0b0e14] text-[11px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.5]">Kilogram</p>
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="backdrop-blur-[2px] bg-[rgba(255,255,255,0.1)] content-stretch flex items-center justify-center p-[5px] relative rounded-[50px] shrink-0">
      <Frame1 />
      <Frame2 />
    </div>
  );
}

function Frame4() {
  return (
    <div className="bg-[rgba(255,255,255,0.1)] content-stretch flex h-[61.586px] items-center justify-center relative rounded-[7.698px] shrink-0 w-[93.341px]">
      <div aria-hidden="true" className="absolute border-[#9aa0a6] border-[0.962px] border-solid inset-0 pointer-events-none rounded-[7.698px]" />
      <div className="flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center leading-[0] relative shrink-0 text-[25.981px] text-center text-white whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[38.491px]">55</p>
      </div>
    </div>
  );
}

function Height() {
  return (
    <div className="content-stretch flex gap-[10px] items-center overflow-clip relative shrink-0" data-name="Height">
      <Frame4 />
      <p className="font-['SF_Pro:Regular',sans-serif] font-normal leading-[21.17px] relative shrink-0 text-[15.396px] text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
        kg
      </p>
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[48px] items-center min-h-px min-w-px py-[48px] relative w-full">
      <div className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] h-[26px] justify-center leading-[0] relative shrink-0 text-[18px] text-center text-white w-[296px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.2] whitespace-pre-wrap">Select goal weight</p>
      </div>
      <Frame3 />
      <Height />
    </div>
  );
}

function Text() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Text">
      <p className="font-['SF_Pro:Medium',sans-serif] font-[510] leading-[20px] relative shrink-0 text-[#0b0e14] text-[16px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        Continue
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
    <div className="absolute content-stretch flex flex-col gap-[10px] h-[768px] items-center left-0 p-[24px] top-[44px] w-[374.55px]" data-name="Container">
      <Header />
      <Frame />
      <Buttons />
    </div>
  );
}

export default function Forge() {
  return (
    <div className="bg-[#0b0e14] relative size-full" data-name="Forge 5/11">
      <div className="absolute bottom-0 h-[812px] left-1/2 pointer-events-none top-0">
        <BarsStatusBarIPhoneLight />
      </div>
      <Container />
    </div>
  );
}