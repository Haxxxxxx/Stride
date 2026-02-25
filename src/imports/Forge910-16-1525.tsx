import svgPaths from "./svg-pmdt32fkey";

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
        <p className="leading-[1.2]">Step 9 of 10</p>
      </div>
      <Placeholder />
    </div>
  );
}

function Frame9() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-center justify-center leading-[0] relative shrink-0 text-center w-full">
      <div className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center min-w-full relative shrink-0 text-[18px] text-white w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.2] whitespace-pre-wrap">What equipment do you have access to?</p>
      </div>
      <div className="flex flex-col font-['SF_Pro:Light',sans-serif] font-[274.31500244140625] justify-center relative shrink-0 text-[#9aa0a6] text-[14px] w-[326px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.2] whitespace-pre-wrap">Select what you can reliably train with each week.</p>
      </div>
    </div>
  );
}

function CheckCircle() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="CheckCircle">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="CheckCircle">
          <path d={svgPaths.p1e46b900} fill="var(--fill-0, #FF6A00)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Text() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-center min-h-px min-w-px relative" data-name="Text">
      <p className="font-['SF_Pro:Medium',sans-serif] font-[510] leading-[20px] relative shrink-0 text-[14px] text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
        Bodyweight Only
      </p>
    </div>
  );
}

function Buttons() {
  return (
    <div className="bg-[rgba(255,255,255,0.1)] relative rounded-[10px] shrink-0 w-full" data-name="Buttons">
      <div aria-hidden="true" className="absolute border border-[#ff6a00] border-solid inset-0 pointer-events-none rounded-[10px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)]" />
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center p-[16px] relative w-full">
          <CheckCircle />
          <Text />
        </div>
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 size-[24px]">
      <div className="relative rounded-[100px] shrink-0 size-[19.5px]">
        <div aria-hidden="true" className="absolute border border-[#ff6a00] border-solid inset-0 pointer-events-none rounded-[100px]" />
      </div>
    </div>
  );
}

function Text1() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-center min-h-px min-w-px relative" data-name="Text">
      <p className="font-['SF_Pro:Medium',sans-serif] font-[510] leading-[20px] relative shrink-0 text-[14px] text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
        Dumbbells / Kettlebells
      </p>
    </div>
  );
}

function Buttons1() {
  return (
    <div className="bg-[rgba(255,255,255,0.1)] relative rounded-[10px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)] shrink-0 w-full" data-name="Buttons">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center p-[16px] relative w-full">
          <Frame2 />
          <Text1 />
        </div>
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 size-[24px]">
      <div className="relative rounded-[100px] shrink-0 size-[19.5px]">
        <div aria-hidden="true" className="absolute border border-[#ff6a00] border-solid inset-0 pointer-events-none rounded-[100px]" />
      </div>
    </div>
  );
}

function Text2() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-center min-h-px min-w-px relative" data-name="Text">
      <p className="font-['SF_Pro:Medium',sans-serif] font-[510] leading-[20px] relative shrink-0 text-[14px] text-white" style={{ fontVariationSettings: "'wdth' 100" }}>{`Barbell & Plates`}</p>
    </div>
  );
}

function Buttons2() {
  return (
    <div className="bg-[rgba(255,255,255,0.1)] relative rounded-[10px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)] shrink-0 w-full" data-name="Buttons">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center p-[16px] relative w-full">
          <Frame3 />
          <Text2 />
        </div>
      </div>
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 size-[24px]">
      <div className="relative rounded-[100px] shrink-0 size-[19.5px]">
        <div aria-hidden="true" className="absolute border border-[#ff6a00] border-solid inset-0 pointer-events-none rounded-[100px]" />
      </div>
    </div>
  );
}

function Text3() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-center min-h-px min-w-px relative" data-name="Text">
      <p className="font-['SF_Pro:Medium',sans-serif] font-[510] leading-[20px] relative shrink-0 text-[14px] text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
        Machines (Commercial Gym)
      </p>
    </div>
  );
}

function Buttons3() {
  return (
    <div className="bg-[rgba(255,255,255,0.1)] relative rounded-[10px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)] shrink-0 w-full" data-name="Buttons">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center p-[16px] relative w-full">
          <Frame4 />
          <Text3 />
        </div>
      </div>
    </div>
  );
}

function Frame5() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 size-[24px]">
      <div className="relative rounded-[100px] shrink-0 size-[19.5px]">
        <div aria-hidden="true" className="absolute border border-[#ff6a00] border-solid inset-0 pointer-events-none rounded-[100px]" />
      </div>
    </div>
  );
}

function Text4() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-center min-h-px min-w-px relative" data-name="Text">
      <p className="font-['SF_Pro:Medium',sans-serif] font-[510] leading-[20px] relative shrink-0 text-[14px] text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
        Bands / Cables / Suspension
      </p>
    </div>
  );
}

function Buttons4() {
  return (
    <div className="bg-[rgba(255,255,255,0.1)] relative rounded-[10px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)] shrink-0 w-full" data-name="Buttons">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center p-[16px] relative w-full">
          <Frame5 />
          <Text4 />
        </div>
      </div>
    </div>
  );
}

function Frame6() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 size-[24px]">
      <div className="relative rounded-[100px] shrink-0 size-[19.5px]">
        <div aria-hidden="true" className="absolute border border-[#ff6a00] border-solid inset-0 pointer-events-none rounded-[100px]" />
      </div>
    </div>
  );
}

function Text5() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-center min-h-px min-w-px relative" data-name="Text">
      <p className="font-['SF_Pro:Medium',sans-serif] font-[510] leading-[20px] relative shrink-0 text-[14px] text-white w-full whitespace-pre-wrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Cardio Equipment (Treadmill, Rower, Bike)
      </p>
    </div>
  );
}

function Buttons5() {
  return (
    <div className="bg-[rgba(255,255,255,0.1)] relative rounded-[10px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)] shrink-0 w-full" data-name="Buttons">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center p-[16px] relative w-full">
          <Frame6 />
          <Text5 />
        </div>
      </div>
    </div>
  );
}

function Frame7() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 size-[24px]">
      <div className="relative rounded-[100px] shrink-0 size-[19.5px]">
        <div aria-hidden="true" className="absolute border border-[#ff6a00] border-solid inset-0 pointer-events-none rounded-[100px]" />
      </div>
    </div>
  );
}

function Text6() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-center min-h-px min-w-px relative" data-name="Text">
      <p className="font-['SF_Pro:Medium',sans-serif] font-[510] leading-[20px] relative shrink-0 text-[14px] text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
        Field / Track / Court
      </p>
    </div>
  );
}

function Buttons6() {
  return (
    <div className="bg-[rgba(255,255,255,0.1)] relative rounded-[10px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)] shrink-0 w-full" data-name="Buttons">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center p-[16px] relative w-full">
          <Frame7 />
          <Text6 />
        </div>
      </div>
    </div>
  );
}

function Frame8() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 size-[24px]">
      <div className="relative rounded-[100px] shrink-0 size-[19.5px]">
        <div aria-hidden="true" className="absolute border border-[#ff6a00] border-solid inset-0 pointer-events-none rounded-[100px]" />
      </div>
    </div>
  );
}

function Text7() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start justify-center min-h-px min-w-px relative" data-name="Text">
      <p className="font-['SF_Pro:Medium',sans-serif] font-[510] leading-[20px] relative shrink-0 text-[14px] text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
        Other / Sport Specific
      </p>
    </div>
  );
}

function Buttons7() {
  return (
    <div className="bg-[rgba(255,255,255,0.1)] relative rounded-[10px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)] shrink-0 w-full" data-name="Buttons">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex gap-[8px] items-center p-[16px] relative w-full">
          <Frame8 />
          <Text7 />
        </div>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
      <Buttons />
      <Buttons1 />
      <Buttons2 />
      <Buttons3 />
      <Buttons4 />
      <Buttons5 />
      <Buttons6 />
      <Buttons7 />
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[48px] items-center min-h-px min-w-px py-[48px] relative w-full">
      <Frame9 />
      <Frame1 />
    </div>
  );
}

function Text8() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Text">
      <p className="font-['SF_Pro:Medium',sans-serif] font-[510] leading-[20px] relative shrink-0 text-[#0b0e14] text-[16px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        Continue
      </p>
    </div>
  );
}

function Buttons8() {
  return (
    <div className="bg-[#ff6a00] content-stretch flex flex-col items-center justify-center px-[16px] py-[12px] relative rounded-[10px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)] shrink-0 w-[326.55px]" data-name="Buttons">
      <Text8 />
    </div>
  );
}

function Container() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[10px] h-[768px] items-center left-0 p-[24px] top-[44px] w-[374.55px]" data-name="Container">
      <Header />
      <Frame />
      <div className="absolute bg-[#0b0e14] bottom-0 h-[29px] left-[-0.23px] w-[375px]" />
      <Buttons8 />
    </div>
  );
}

export default function Forge() {
  return (
    <div className="bg-[#0b0e14] relative size-full" data-name="Forge 9/10">
      <div className="absolute bottom-0 h-[812px] left-1/2 pointer-events-none top-0">
        <BarsStatusBarIPhoneLight />
      </div>
      <Container />
    </div>
  );
}