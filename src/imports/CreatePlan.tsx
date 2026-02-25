import svgPaths from "./svg-v0sj4hk01y";

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

function Grah() {
  return (
    <div className="absolute contents left-[-0.77px] top-[-35px]" data-name="Grah">
      <div className="absolute flex items-center justify-center left-[1.84px] size-[322.226px] top-[-32.39px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
        <div className="flex-none rotate-[55.82deg]">
          <div className="relative size-[231.972px]">
            <div className="absolute inset-[0.23%_0.23%_0_0]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 231.445 231.445">
                <path d={svgPaths.p3d5eedf2} fill="var(--fill-0, #9AA0A6)" id="Ellipse 2" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute flex items-center justify-center left-[-0.77px] size-[327.45px] top-[-35px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
        <div className="flex-none rotate-[-138.49deg]">
          <div className="relative size-[231.972px]">
            <div className="absolute inset-[0.23%_0.23%_0_0]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 231.445 231.445">
                <path d={svgPaths.p3d5eedf2} fill="var(--fill-0, #FF6A00)" id="Ellipse 1" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['SF_Pro:Bold',sans-serif] font-bold justify-center leading-[0] left-[162.95px] size-[210.883px] text-[40px] text-center text-white top-[128.72px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[40.419px] whitespace-pre-wrap">78%</p>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="h-[257px] relative shrink-0 w-[327px]">
      <Grah />
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-center min-h-px min-w-px py-[48px] relative w-full">
      <div className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center leading-[0] relative shrink-0 text-[22px] text-center text-white w-[296px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.2] whitespace-pre-wrap">Forging your training program…</p>
      </div>
      <Frame1 />
      <p className="font-['SF_Pro:Regular',sans-serif] font-normal leading-[21.17px] relative shrink-0 text-[15.396px] text-center text-white w-[269px] whitespace-pre-wrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        FORGE creates a personalized training plan based on your profile, activity level, and goals.
      </p>
    </div>
  );
}

function Text() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Text">
      <p className="font-['SF_Pro:Medium',sans-serif] font-[510] leading-[20px] relative shrink-0 text-[#0b0e14] text-[16px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        Start Training
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
      <Frame />
      <Buttons />
    </div>
  );
}

export default function CreatePlan() {
  return (
    <div className="bg-[#0b0e14] relative size-full" data-name="Create-Plan">
      <div className="absolute bottom-0 h-[812px] left-1/2 pointer-events-none top-0">
        <BarsStatusBarIPhoneLight />
      </div>
      <Container />
    </div>
  );
}