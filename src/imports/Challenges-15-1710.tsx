import svgPaths from "./svg-jusca3vgj1";
import imgImage7 from "figma:asset/bf6da9de1404bcbb96bc246c72916c15f2e89025.png";
import imgImage8 from "figma:asset/24b6a62b7bae129c46221394e6598883d13abaec.png";
import imgImage12 from "figma:asset/dd40dbe95c08e8ffafa5e44173f6b8033e5ccfed.png";
import imgImage10 from "figma:asset/f66d8c8b01a14e7f20794613021e602bd29e44f5.png";
import imgImage2 from "figma:asset/fa12b2e954b8d8835c7af0f64149782f3496b2f7.png";

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
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="CaretLeft" opacity="0">
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
        <p className="leading-[1.2]">Challenges</p>
      </div>
      <Placeholder />
    </div>
  );
}

function Frame26() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start leading-[0] relative shrink-0 w-full">
      <div className="flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center relative shrink-0 text-[18px] text-white w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.2] whitespace-pre-wrap">February Community Challenge</p>
      </div>
      <div className="flex flex-col font-['SF_Pro:Light',sans-serif] font-[274.31500244140625] justify-center relative shrink-0 text-[12px] text-[rgba(255,255,255,0.8)] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.2] whitespace-pre-wrap">Have a Consistency Score of at least 80% by the end of the month.</p>
      </div>
    </div>
  );
}

function AutoLayoutVertical1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Auto Layout Vertical">
      <Frame26 />
    </div>
  );
}

function AutoLayoutVertical() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative" data-name="Auto Layout Vertical">
      <AutoLayoutVertical1 />
    </div>
  );
}

function Fire() {
  return (
    <div className="-translate-x-1/2 absolute left-[calc(50%+0.1px)] size-[16px] top-[28px]" data-name="Fire">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Fire">
          <path d={svgPaths.p305a1d00} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame25() {
  return (
    <div className="col-1 content-stretch flex flex-col items-start ml-[15.63px] mt-[23.28px] relative row-1">
      <div className="flex flex-col font-['SF_Pro:Bold',sans-serif] font-bold justify-center leading-[0] relative shrink-0 text-[14px] text-center text-white whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.2]">80%</p>
      </div>
      <Fire />
    </div>
  );
}

function Group1() {
  return (
    <div className="col-1 h-[64.294px] ml-0 mt-0 relative row-1 w-[64.645px]" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 64.6449 64.2947">
        <g id="Group">
          <path d={svgPaths.p4e5280} fill="var(--fill-0, white)" fillOpacity="0.2" id="Ellipse" />
          <path d={svgPaths.p206a6700} fill="var(--fill-0, white)" id="Ellipse_2" />
        </g>
      </svg>
    </div>
  );
}

function Group() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid items-[start] justify-items-[start] leading-[0] relative shrink-0" data-name="Group">
      <Frame25 />
      <Group1 />
    </div>
  );
}

function Frame27() {
  return (
    <div className="content-stretch flex gap-[24px] items-center relative shrink-0 w-full">
      <AutoLayoutVertical />
      <Group />
    </div>
  );
}

function Text() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="Text">
      <p className="font-['SF_Pro:Regular',sans-serif] font-normal leading-[1.2] relative shrink-0 text-[14px] text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
        Start the Challenge →
      </p>
    </div>
  );
}

function Buttons() {
  return (
    <div className="content-stretch flex flex-col items-center justify-center px-[16px] py-[8px] relative rounded-[16px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.1)] shrink-0" data-name="Buttons" style={{ backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 100%), linear-gradient(90deg, rgb(11, 14, 20) 0%, rgb(11, 14, 20) 100%)" }}>
      <Text />
    </div>
  );
}

function BalanceCard() {
  return (
    <div className="relative rounded-[16px] shrink-0 w-[326px]" data-name="Balance Card" style={{ backgroundImage: "linear-gradient(99.8586deg, rgba(255, 255, 255, 0.5) 0.10239%, rgba(255, 255, 255, 0) 49.898%, rgba(255, 255, 255, 0.5) 99.898%), linear-gradient(90deg, rgb(255, 106, 0) 0%, rgb(255, 106, 0) 100%)" }}>
      <div className="content-stretch flex flex-col gap-[16px] items-start justify-center overflow-clip px-[16px] py-[24px] relative rounded-[inherit] w-full">
        <div className="absolute h-[137px] left-[-0.28px] top-[-65px] w-[326px]">
          <div className="absolute inset-[-109.49%_-46.01%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 626 437">
              <g filter="url(#filter0_f_1_600)" id="Ellipse 7">
                <ellipse cx="313" cy="218.5" fill="var(--fill-0, #FF6A00)" rx="163" ry="68.5" />
              </g>
              <defs>
                <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="437" id="filter0_f_1_600" width="626" x="0" y="0">
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                  <feGaussianBlur result="effect1_foregroundBlur_1_600" stdDeviation="75" />
                </filter>
              </defs>
            </svg>
          </div>
        </div>
        <div className="absolute h-[137px] left-[-0.28px] top-[-65px] w-[326px]">
          <div className="absolute inset-[-109.49%_-46.01%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 626 437">
              <g filter="url(#filter0_f_1_600)" id="Ellipse 7">
                <ellipse cx="313" cy="218.5" fill="var(--fill-0, #FF6A00)" rx="163" ry="68.5" />
              </g>
              <defs>
                <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="437" id="filter0_f_1_600" width="626" x="0" y="0">
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend in="SourceGraphic" in2="BackgroundImageFix" mode="normal" result="shape" />
                  <feGaussianBlur result="effect1_foregroundBlur_1_600" stdDeviation="75" />
                </filter>
              </defs>
            </svg>
          </div>
        </div>
        <Frame27 />
        <Buttons />
      </div>
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_-4px_20px_0px_rgba(0,0,0,0.25)]" />
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.1)] border-solid inset-0 pointer-events-none rounded-[16px]" />
    </div>
  );
}

function Barbell() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Barbell">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.0025 18">
        <g id="Barbell">
          <path d={svgPaths.p184aee00} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame28() {
  return (
    <div className="bg-[#ff6a00] content-stretch flex items-center justify-center relative rounded-[8px] shrink-0 size-[36px]">
      <Barbell />
    </div>
  );
}

function Frame11() {
  return (
    <div className="content-stretch flex flex-col items-start not-italic relative shrink-0">
      <p className="font-['Satoshi:Bold',sans-serif] leading-[normal] relative shrink-0 text-[16px] text-white">Home Squad</p>
      <p className="font-['Satoshi:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[12px] text-[rgba(255,255,255,0.7)]">Consistency</p>
    </div>
  );
}

function Frame20() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <Frame28 />
      <Frame11 />
    </div>
  );
}

function Group3() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid items-[start] justify-items-[start] leading-[0] mr-[-3.8px] relative shrink-0">
      <div className="col-1 flex h-[50.625px] items-center justify-center ml-[-20.63px] mt-[-2.5px] relative row-1 w-[90px]">
        <div className="-scale-y-100 flex-none rotate-180">
          <div className="h-[50.625px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[20.625px_2.5px] mask-size-[20px_20px] relative w-[90px]" data-name="image 7" style={{ maskImage: `url('${imgImage7}')` }}>
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage8} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Group4() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid items-[start] justify-items-[start] leading-[0] mr-[-3.8px] relative shrink-0">
      <div className="col-1 h-[50.625px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[10px_4.375px] mask-size-[20px_20px] ml-[-10px] mt-[-4.38px] relative row-1 w-[40.625px]" data-name="image 12" style={{ maskImage: `url('${imgImage7}')` }}>
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage12} />
      </div>
    </div>
  );
}

function Group2() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid items-[start] justify-items-[start] leading-[0] mr-[-3.8px] relative shrink-0">
      <div className="col-1 h-[43.2px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[4.8px_13.2px] mask-size-[20px_20px] ml-[-4.8px] mt-[-13.2px] relative row-1 w-[28.8px]" data-name="image 10" style={{ maskImage: `url('${imgImage7}')` }}>
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage10} />
      </div>
      <div className="col-1 h-[36.875px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[5.625px_3.125px] mask-size-[20px_20px] ml-[-5.62px] mt-[-3.13px] relative row-1 w-[30px]" data-name="image 2" style={{ maskImage: `url('${imgImage7}')` }}>
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage2} />
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="bg-[#0b0e14] content-stretch flex flex-col items-center justify-center mr-[-3.8px] px-[1.739px] py-[2.609px] relative rounded-[13.333px] shrink-0 size-[20px]">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.1)] border-solid inset-0 pointer-events-none rounded-[13.333px]" />
      <p className="font-['SF_Pro:Medium',sans-serif] font-[510] leading-[1.2] relative shrink-0 text-[8px] text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
        +4
      </p>
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex items-center pr-[3.8px] relative shrink-0">
      <Group3 />
      <Group4 />
      <Group2 />
      <Frame1 />
    </div>
  );
}

function Frame16() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
      <Frame20 />
      <Frame />
    </div>
  );
}

function CardGroups() {
  return (
    <div className="bg-[rgba(255,255,255,0.05)] content-stretch flex flex-col items-start overflow-clip px-[16px] py-[24px] relative rounded-[16px] shrink-0 w-[326px]" data-name="Card Groups">
      <Frame16 />
    </div>
  );
}

function Barbell1() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Barbell">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.0025 18">
        <g id="Barbell">
          <path d={svgPaths.p184aee00} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame29() {
  return (
    <div className="bg-[#ff6a00] content-stretch flex items-center justify-center relative rounded-[8px] shrink-0 size-[36px]">
      <Barbell1 />
    </div>
  );
}

function Frame12() {
  return (
    <div className="content-stretch flex flex-col items-start not-italic relative shrink-0">
      <p className="font-['Satoshi:Bold',sans-serif] leading-[normal] relative shrink-0 text-[16px] text-white">Home Squad</p>
      <p className="font-['Satoshi:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[12px] text-[rgba(255,255,255,0.7)]">Consistency</p>
    </div>
  );
}

function Frame21() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <Frame29 />
      <Frame12 />
    </div>
  );
}

function Group5() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid items-[start] justify-items-[start] leading-[0] mr-[-3.8px] relative shrink-0">
      <div className="col-1 flex h-[50.625px] items-center justify-center ml-[-20.63px] mt-[-2.5px] relative row-1 w-[90px]">
        <div className="-scale-y-100 flex-none rotate-180">
          <div className="h-[50.625px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[20.625px_2.5px] mask-size-[20px_20px] relative w-[90px]" data-name="image 7" style={{ maskImage: `url('${imgImage7}')` }}>
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage8} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Group6() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid items-[start] justify-items-[start] leading-[0] mr-[-3.8px] relative shrink-0">
      <div className="col-1 h-[50.625px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[10px_4.375px] mask-size-[20px_20px] ml-[-10px] mt-[-4.38px] relative row-1 w-[40.625px]" data-name="image 12" style={{ maskImage: `url('${imgImage7}')` }}>
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage12} />
      </div>
    </div>
  );
}

function Group7() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid items-[start] justify-items-[start] leading-[0] mr-[-3.8px] relative shrink-0">
      <div className="col-1 h-[43.2px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[4.8px_13.2px] mask-size-[20px_20px] ml-[-4.8px] mt-[-13.2px] relative row-1 w-[28.8px]" data-name="image 10" style={{ maskImage: `url('${imgImage7}')` }}>
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage10} />
      </div>
      <div className="col-1 h-[36.875px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[5.625px_3.125px] mask-size-[20px_20px] ml-[-5.62px] mt-[-3.13px] relative row-1 w-[30px]" data-name="image 2" style={{ maskImage: `url('${imgImage7}')` }}>
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage2} />
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="bg-[#0b0e14] content-stretch flex flex-col items-center justify-center mr-[-3.8px] px-[1.739px] py-[2.609px] relative rounded-[13.333px] shrink-0 size-[20px]">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.1)] border-solid inset-0 pointer-events-none rounded-[13.333px]" />
      <p className="font-['SF_Pro:Medium',sans-serif] font-[510] leading-[1.2] relative shrink-0 text-[8px] text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
        +4
      </p>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex items-center pr-[3.8px] relative shrink-0">
      <Group5 />
      <Group6 />
      <Group7 />
      <Frame3 />
    </div>
  );
}

function Frame17() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
      <Frame21 />
      <Frame2 />
    </div>
  );
}

function CardGroups1() {
  return (
    <div className="bg-[rgba(255,255,255,0.05)] content-stretch flex flex-col items-start overflow-clip px-[16px] py-[24px] relative rounded-[16px] shrink-0 w-[326px]" data-name="Card Groups">
      <Frame17 />
    </div>
  );
}

function Barbell2() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Barbell">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.0025 18">
        <g id="Barbell">
          <path d={svgPaths.p184aee00} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame30() {
  return (
    <div className="bg-[#ff6a00] content-stretch flex items-center justify-center relative rounded-[8px] shrink-0 size-[36px]">
      <Barbell2 />
    </div>
  );
}

function Frame13() {
  return (
    <div className="content-stretch flex flex-col items-start not-italic relative shrink-0">
      <p className="font-['Satoshi:Bold',sans-serif] leading-[normal] relative shrink-0 text-[16px] text-white">Home Squad</p>
      <p className="font-['Satoshi:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[12px] text-[rgba(255,255,255,0.7)]">Consistency</p>
    </div>
  );
}

function Frame22() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <Frame30 />
      <Frame13 />
    </div>
  );
}

function Group8() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid items-[start] justify-items-[start] leading-[0] mr-[-3.8px] relative shrink-0">
      <div className="col-1 flex h-[50.625px] items-center justify-center ml-[-20.63px] mt-[-2.5px] relative row-1 w-[90px]">
        <div className="-scale-y-100 flex-none rotate-180">
          <div className="h-[50.625px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[20.625px_2.5px] mask-size-[20px_20px] relative w-[90px]" data-name="image 7" style={{ maskImage: `url('${imgImage7}')` }}>
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage8} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Group9() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid items-[start] justify-items-[start] leading-[0] mr-[-3.8px] relative shrink-0">
      <div className="col-1 h-[50.625px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[10px_4.375px] mask-size-[20px_20px] ml-[-10px] mt-[-4.38px] relative row-1 w-[40.625px]" data-name="image 12" style={{ maskImage: `url('${imgImage7}')` }}>
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage12} />
      </div>
    </div>
  );
}

function Group10() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid items-[start] justify-items-[start] leading-[0] mr-[-3.8px] relative shrink-0">
      <div className="col-1 h-[43.2px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[4.8px_13.2px] mask-size-[20px_20px] ml-[-4.8px] mt-[-13.2px] relative row-1 w-[28.8px]" data-name="image 10" style={{ maskImage: `url('${imgImage7}')` }}>
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage10} />
      </div>
      <div className="col-1 h-[36.875px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[5.625px_3.125px] mask-size-[20px_20px] ml-[-5.62px] mt-[-3.13px] relative row-1 w-[30px]" data-name="image 2" style={{ maskImage: `url('${imgImage7}')` }}>
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage2} />
      </div>
    </div>
  );
}

function Frame5() {
  return (
    <div className="bg-[#0b0e14] content-stretch flex flex-col items-center justify-center mr-[-3.8px] px-[1.739px] py-[2.609px] relative rounded-[13.333px] shrink-0 size-[20px]">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.1)] border-solid inset-0 pointer-events-none rounded-[13.333px]" />
      <p className="font-['SF_Pro:Medium',sans-serif] font-[510] leading-[1.2] relative shrink-0 text-[8px] text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
        +4
      </p>
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex items-center pr-[3.8px] relative shrink-0">
      <Group8 />
      <Group9 />
      <Group10 />
      <Frame5 />
    </div>
  );
}

function Frame18() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
      <Frame22 />
      <Frame4 />
    </div>
  );
}

function CardGroups2() {
  return (
    <div className="bg-[rgba(255,255,255,0.05)] content-stretch flex flex-col items-start overflow-clip px-[16px] py-[24px] relative rounded-[16px] shrink-0 w-[326px]" data-name="Card Groups">
      <Frame18 />
    </div>
  );
}

function Barbell3() {
  return (
    <div className="relative shrink-0 size-[18px]" data-name="Barbell">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 18.0025 18">
        <g id="Barbell">
          <path d={svgPaths.p184aee00} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame31() {
  return (
    <div className="bg-[#ff6a00] content-stretch flex items-center justify-center relative rounded-[8px] shrink-0 size-[36px]">
      <Barbell3 />
    </div>
  );
}

function Frame14() {
  return (
    <div className="content-stretch flex flex-col items-start not-italic relative shrink-0">
      <p className="font-['Satoshi:Bold',sans-serif] leading-[normal] relative shrink-0 text-[16px] text-white">Home Squad</p>
      <p className="font-['Satoshi:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[12px] text-[rgba(255,255,255,0.7)]">Consistency</p>
    </div>
  );
}

function Frame23() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <Frame31 />
      <Frame14 />
    </div>
  );
}

function Group11() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid items-[start] justify-items-[start] leading-[0] mr-[-3.8px] relative shrink-0">
      <div className="col-1 flex h-[50.625px] items-center justify-center ml-[-20.63px] mt-[-2.5px] relative row-1 w-[90px]">
        <div className="-scale-y-100 flex-none rotate-180">
          <div className="h-[50.625px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[20.625px_2.5px] mask-size-[20px_20px] relative w-[90px]" data-name="image 7" style={{ maskImage: `url('${imgImage7}')` }}>
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage8} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Group12() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid items-[start] justify-items-[start] leading-[0] mr-[-3.8px] relative shrink-0">
      <div className="col-1 h-[50.625px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[10px_4.375px] mask-size-[20px_20px] ml-[-10px] mt-[-4.38px] relative row-1 w-[40.625px]" data-name="image 12" style={{ maskImage: `url('${imgImage7}')` }}>
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage12} />
      </div>
    </div>
  );
}

function Group13() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid items-[start] justify-items-[start] leading-[0] mr-[-3.8px] relative shrink-0">
      <div className="col-1 h-[43.2px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[4.8px_13.2px] mask-size-[20px_20px] ml-[-4.8px] mt-[-13.2px] relative row-1 w-[28.8px]" data-name="image 10" style={{ maskImage: `url('${imgImage7}')` }}>
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage10} />
      </div>
      <div className="col-1 h-[36.875px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[5.625px_3.125px] mask-size-[20px_20px] ml-[-5.62px] mt-[-3.13px] relative row-1 w-[30px]" data-name="image 2" style={{ maskImage: `url('${imgImage7}')` }}>
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage2} />
      </div>
    </div>
  );
}

function Frame7() {
  return (
    <div className="bg-[#0b0e14] content-stretch flex flex-col items-center justify-center mr-[-3.8px] px-[1.739px] py-[2.609px] relative rounded-[13.333px] shrink-0 size-[20px]">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.1)] border-solid inset-0 pointer-events-none rounded-[13.333px]" />
      <p className="font-['SF_Pro:Medium',sans-serif] font-[510] leading-[1.2] relative shrink-0 text-[8px] text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
        +4
      </p>
    </div>
  );
}

function Frame6() {
  return (
    <div className="content-stretch flex items-center pr-[3.8px] relative shrink-0">
      <Group11 />
      <Group12 />
      <Group13 />
      <Frame7 />
    </div>
  );
}

function Frame19() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
      <Frame23 />
      <Frame6 />
    </div>
  );
}

function CardGroups3() {
  return (
    <div className="bg-[rgba(255,255,255,0.05)] content-stretch flex flex-col items-start overflow-clip px-[16px] py-[24px] relative rounded-[16px] shrink-0 w-[326px]" data-name="Card Groups">
      <Frame19 />
    </div>
  );
}

function Frame15() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-[326.55px]">
      <div className="flex flex-col font-['Satoshi:Medium',sans-serif] justify-end leading-[0] min-w-full not-italic relative shrink-0 text-[16px] text-white w-[min-content]">
        <p className="leading-[1.2] whitespace-pre-wrap">Squads</p>
      </div>
      <CardGroups />
      <CardGroups1 />
      <CardGroups2 />
      <CardGroups3 />
    </div>
  );
}

function Frame24() {
  return (
    <div className="absolute bottom-[70px] right-[-0.45px] size-[40px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 40 40">
        <g id="Frame 1597880557">
          <rect fill="var(--fill-0, #FF6A00)" height="40" rx="20" width="40" />
          <path d={svgPaths.p49c3300} fill="var(--fill-0, #0B0E14)" id="Star 1" />
        </g>
      </svg>
    </div>
  );
}

function Content() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-center min-h-px min-w-px relative w-full" data-name="Content">
      <Header />
      <BalanceCard />
      <Frame15 />
      <Frame24 />
    </div>
  );
}

function Container() {
  return (
    <div className="absolute content-stretch flex flex-col h-[768px] items-start left-0 p-[24px] top-[44px] w-[374.55px]" data-name="Container">
      <Content />
    </div>
  );
}

function HouseSimple() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="HouseSimple">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="HouseSimple">
          <path d={svgPaths.p37582e00} fill="var(--fill-0, white)" fillOpacity="0.5" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame8() {
  return (
    <div className="content-stretch flex flex-[1_0_0] h-full items-center justify-center min-h-px min-w-px relative">
      <HouseSimple />
    </div>
  );
}

function Target() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Target">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Target">
          <path d={svgPaths.p2fc49e00} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame9() {
  return (
    <div className="content-stretch flex flex-[1_0_0] h-full items-center justify-center min-h-px min-w-px relative rounded-[13px]" style={{ backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 100%), linear-gradient(90deg, rgb(255, 106, 0) 0%, rgb(255, 106, 0) 100%)" }}>
      <Target />
    </div>
  );
}

function User() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="User">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="User">
          <path d={svgPaths.p2402fb00} fill="var(--fill-0, white)" fillOpacity="0.5" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame10() {
  return (
    <div className="content-stretch flex flex-[1_0_0] h-full items-center justify-center min-h-px min-w-px relative">
      <User />
    </div>
  );
}

function Navbar1() {
  return (
    <div className="backdrop-blur-[5px] bg-[rgba(255,255,255,0.1)] content-stretch flex h-[50px] items-center justify-between p-[2px] relative rounded-[15px] shrink-0 w-[338px]" data-name="Navbar">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.1)] border-solid inset-0 pointer-events-none rounded-[15px]" />
      <Frame8 />
      <Frame9 />
      <Frame10 />
    </div>
  );
}

function Navbar() {
  return (
    <div className="-translate-x-1/2 absolute bottom-0 content-stretch flex flex-col h-[90px] items-center left-1/2 p-[16px] w-[375px]" data-name="Navbar">
      <Navbar1 />
    </div>
  );
}

export default function Challenges() {
  return (
    <div className="bg-[#061113] relative size-full" data-name="Challenges">
      <div className="absolute bottom-0 h-[812px] left-1/2 pointer-events-none top-0">
        <BarsStatusBarIPhoneLight />
      </div>
      <Container />
      <Navbar />
    </div>
  );
}