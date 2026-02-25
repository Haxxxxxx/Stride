import svgPaths from "./svg-888tgau0qb";
import imgRectangle7 from "figma:asset/dc33bf4dcbc192d6dda86d23d93b5f6dced4ef05.png";

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

function MaskGroup() {
  return (
    <div className="absolute contents left-[-18.69px] top-[-16.31px]" data-name="Mask group">
      <div className="absolute bg-white h-[87.023px] left-[-22.35px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[3.664px_4.947px] mask-size-[72.55px_72.55px] top-[-21.25px] w-[81.16px]" style={{ maskImage: `url('${imgRectangle7}')` }} />
    </div>
  );
}

function Frame8() {
  return (
    <div className="h-[24px] overflow-clip relative shrink-0 w-[35.176px]">
      <MaskGroup />
    </div>
  );
}

function Wrapper() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center relative shrink-0 w-full" data-name="Wrapper">
      <p className="font-['SF_Pro:Semibold',sans-serif] font-semibold leading-[28px] relative shrink-0 text-[20px] text-center text-white w-full whitespace-pre-wrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Welcome to Stride
      </p>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-center relative shrink-0 w-full">
      <Frame8 />
      <Wrapper />
    </div>
  );
}

function Text() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Text">
      <p className="flex-[1_0_0] font-['Inter:Medium',sans-serif] font-medium leading-[20px] min-h-px min-w-px not-italic relative text-[14px] text-white whitespace-pre-wrap">Email</p>
    </div>
  );
}

function Text1() {
  return (
    <div className="content-stretch flex flex-[1_0_0] items-center min-h-px min-w-px relative" data-name="Text">
      <p className="flex-[1_0_0] font-['SF_Pro:Regular',sans-serif] font-normal leading-[24px] min-h-px min-w-px overflow-hidden relative text-[#9aa0a6] text-[14px] text-ellipsis whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        m@example.com
      </p>
    </div>
  );
}

function Input() {
  return (
    <div className="bg-white h-[36px] relative rounded-[8px] shrink-0 w-full" data-name="Input">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center justify-between px-[12px] py-[4px] relative size-full">
          <Text1 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)]" />
    </div>
  );
}

function WithLabel() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="With Label">
      <Text />
      <Input />
    </div>
  );
}

function Text2() {
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
      <Text2 />
    </div>
  );
}

function Frame6() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
      <WithLabel />
      <Buttons />
    </div>
  );
}

function Text3() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 w-full" data-name="Text">
      <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#9aa0a6] text-[12px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[16px]">OR CONTINUE WITH</p>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex flex-col items-start px-[8px] relative shrink-0 w-[138px]">
      <Text3 />
    </div>
  );
}

function Divider() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 w-full" data-name="Divider">
      <div className="flex-[1_0_0] h-px min-h-px min-w-px relative" data-name="Divider">
        <div aria-hidden="true" className="absolute border-[#e5e5e5] border-solid border-t inset-0 pointer-events-none" />
      </div>
      <Frame1 />
      <div className="flex-[1_0_0] h-px min-h-px min-w-px relative" data-name="Divider">
        <div aria-hidden="true" className="absolute border-[#e5e5e5] border-solid border-t inset-0 pointer-events-none" />
      </div>
    </div>
  );
}

function Wallet() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Wallet">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18 18">
        <g id="Wallet">
          <path d={svgPaths.p2665000} fill="var(--fill-0, #0B0E14)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Wrapper1() {
  return (
    <div className="content-stretch flex items-center pr-[8px] relative shrink-0" data-name="Wrapper">
      <Wallet />
    </div>
  );
}

function Text4() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Text">
      <div className="flex flex-col font-['Inter:Medium',sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#0b0e14] text-[14px] text-center whitespace-nowrap">
        <p className="leading-[20px]">Connect Wallet</p>
      </div>
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex items-center relative shrink-0">
      <Wrapper1 />
      <Text4 />
    </div>
  );
}

function Button() {
  return (
    <div className="bg-white flex-[1_0_0] min-h-px min-w-px relative rounded-[8px]" data-name="Button">
      <div aria-hidden="true" className="absolute border border-[#e5e5e5] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)]" />
      <div className="flex flex-col items-center justify-center size-full">
        <div className="content-stretch flex flex-col items-center justify-center p-[12px] relative w-full">
          <Frame />
        </div>
      </div>
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 w-full">
      <Button />
    </div>
  );
}

function Frame7() {
  return (
    <div className="content-stretch flex flex-col gap-[28px] items-center relative shrink-0 w-full">
      <Frame2 />
      <Frame6 />
      <Divider />
      <Frame4 />
    </div>
  );
}

function Text5() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 w-full" data-name="Text">
      <div className="flex flex-col font-['Inter:Regular',sans-serif] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#a1a1aa] text-[0px] text-center w-[229px]">
        <p className="font-['SF_Pro:Regular',sans-serif] text-[#9aa0a6] text-[12px] whitespace-pre-wrap">
          <span className="leading-[16px]" style={{ fontVariationSettings: "'wdth' 100" }}>{`By clicking continue, you agree to our `}</span>
          <a className="[text-decoration-skip-ink:none] cursor-pointer decoration-solid leading-[16px] underline" href="https://ui.shadcn.com/terms" style={{ fontVariationSettings: "'wdth' 100" }}>
            <span className="[text-decoration-skip-ink:none] decoration-solid leading-[16px]" href="https://ui.shadcn.com/terms" style={{ fontVariationSettings: "'wdth' 100" }}>
              Terms of Service
            </span>
          </a>
          <span className="leading-[16px]" style={{ fontVariationSettings: "'wdth' 100" }}>{` and `}</span>
          <a className="[text-decoration-skip-ink:none] cursor-pointer decoration-solid leading-[16px] underline" href="https://ui.shadcn.com/privacy" style={{ fontVariationSettings: "'wdth' 100" }}>
            <span className="[text-decoration-skip-ink:none] decoration-solid leading-[16px]" href="https://ui.shadcn.com/privacy" style={{ fontVariationSettings: "'wdth' 100" }}>
              Privacy Policy
            </span>
          </a>
          <span className="leading-[16px]" style={{ fontVariationSettings: "'wdth' 100" }}>
            .
          </span>
        </p>
      </div>
    </div>
  );
}

function Frame5() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <Text5 />
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-center relative shrink-0 w-[327px]">
      <Frame7 />
      <Frame5 />
    </div>
  );
}

function Container() {
  return (
    <div className="absolute content-stretch flex flex-col h-[768px] items-center justify-center left-0 p-[24px] top-[44px] w-[374.55px]" data-name="Container">
      <Frame3 />
    </div>
  );
}

export default function Gate() {
  return (
    <div className="bg-[#0b0e14] relative size-full" data-name="Gate 1/4">
      <div className="absolute bottom-0 h-[812px] left-1/2 pointer-events-none top-0">
        <BarsStatusBarIPhoneLight />
      </div>
      <Container />
    </div>
  );
}