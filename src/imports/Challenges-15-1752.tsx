import svgPaths from "./svg-kkv1ewhj0h";
import imgImage7 from "figma:asset/6a8f7a84cb7b82d6fb29e24143941cc29690b793.png";
import imgImage8 from "figma:asset/24b6a62b7bae129c46221394e6598883d13abaec.png";
import imgImage12 from "figma:asset/dd40dbe95c08e8ffafa5e44173f6b8033e5ccfed.png";
import imgImage10 from "figma:asset/f66d8c8b01a14e7f20794613021e602bd29e44f5.png";
import imgImage2 from "figma:asset/fa12b2e954b8d8835c7af0f64149782f3496b2f7.png";
import imgImage4 from "figma:asset/fe53e1f8eb8b68ad447a32a2cfd734b3e3c0c656.png";

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
        <p className="leading-[1.2]">Community Challenge</p>
      </div>
      <Placeholder />
    </div>
  );
}

function Fire() {
  return (
    <div className="relative shrink-0 size-[32px]" data-name="Fire">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="Fire">
          <path d={svgPaths.p23d5ed70} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame7() {
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
      <Frame7 />
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

function Frame8() {
  return (
    <div className="content-stretch flex flex-[1_0_0] items-start justify-center min-h-px min-w-px relative">
      <AutoLayoutVertical />
    </div>
  );
}

function BalanceCard() {
  return (
    <div className="relative rounded-[16px] shrink-0 w-[326px]" data-name="Balance Card" style={{ backgroundImage: "linear-gradient(103.629deg, rgba(255, 255, 255, 0.5) 0.10239%, rgba(255, 255, 255, 0) 49.898%, rgba(255, 255, 255, 0.5) 99.898%), linear-gradient(90deg, rgb(255, 106, 0) 0%, rgb(255, 106, 0) 100%)" }}>
      <div className="content-stretch flex gap-[16px] items-center justify-center overflow-clip px-[16px] py-[24px] relative rounded-[inherit] w-full">
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
        <Fire />
        <Frame8 />
      </div>
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_-4px_20px_0px_rgba(0,0,0,0.25)]" />
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.1)] border-solid inset-0 pointer-events-none rounded-[16px]" />
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start leading-[18px] relative shrink-0 text-[12px] w-[118px] whitespace-pre-wrap">
      <p className="font-['SF_Pro:Semibold',sans-serif] font-[590] relative shrink-0 text-white tracking-[1px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
        Your Progress
      </p>
      <p className="font-['SF_Pro:Light',sans-serif] font-[274.31500244140625] relative shrink-0 text-[rgba(255,255,255,0.8)] tracking-[0.3px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
        Since 20 days ago
      </p>
    </div>
  );
}

function TitleData() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Title data">
      <Frame />
      <p className="font-['SF_Pro:Bold',sans-serif] font-bold leading-[32px] relative shrink-0 text-[22px] text-white tracking-[-1px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        65%
      </p>
    </div>
  );
}

function ProgressBar() {
  return (
    <div className="h-[4px] overflow-clip relative rounded-[100px] shrink-0 w-full" data-name="Progress bar">
      <div className="absolute bg-white h-[4px] left-0 opacity-20 top-0 w-[335px]" />
      <div className="absolute bg-white h-[4px] left-0 top-0 w-[181px]" />
    </div>
  );
}

function ProgressData() {
  return (
    <div className="bg-[rgba(255,255,255,0.1)] relative rounded-[16px] shrink-0 w-full" data-name="Progress data">
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.1)] border-solid inset-0 pointer-events-none rounded-[16px]" />
      <div className="content-stretch flex flex-col gap-[16px] items-start px-[16px] py-[24px] relative w-full">
        <TitleData />
        <ProgressBar />
      </div>
    </div>
  );
}

function Group1() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid items-[start] justify-items-[start] leading-[0] relative shrink-0">
      <div className="col-1 flex h-[81px] items-center justify-center ml-[-33px] mt-[-4px] relative row-1 w-[144px]">
        <div className="-scale-y-100 flex-none rotate-180">
          <div className="h-[81px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[33px_4px] mask-size-[32px_32px] relative w-[144px]" data-name="image 7" style={{ maskImage: `url('${imgImage7}')` }}>
            <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage8} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0">
      <Group1 />
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[16px] not-italic relative shrink-0 text-[16px] text-white w-[135px] whitespace-pre-wrap">Budi Santoso</p>
    </div>
  );
}

function NameData1() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[225px]" data-name="Name data">
      <p className="font-['SF_Pro:Semibold',sans-serif] font-[590] leading-[16px] relative shrink-0 text-[14px] text-[rgba(255,255,255,0.8)]" style={{ fontVariationSettings: "'wdth' 100" }}>
        01.
      </p>
      <Frame1 />
    </div>
  );
}

function NameData() {
  return (
    <div className="content-stretch flex items-center justify-between py-[4px] relative shrink-0 w-full" data-name="Name data">
      <div aria-hidden="true" className="absolute border-0 border-[rgba(255,255,255,0.8)] border-solid inset-0 pointer-events-none" />
      <NameData1 />
      <p className="font-['SF_Pro:Semibold',sans-serif] font-[590] leading-[16px] relative shrink-0 text-[14px] text-[rgba(255,255,255,0.8)]" style={{ fontVariationSettings: "'wdth' 100" }}>
        85%
      </p>
    </div>
  );
}

function Group2() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid items-[start] justify-items-[start] leading-[0] relative shrink-0">
      <div className="col-1 h-[81px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[16px_7px] mask-size-[32px_32px] ml-[-16px] mt-[-7px] relative row-1 w-[65px]" data-name="image 12" style={{ maskImage: `url('${imgImage7}')` }}>
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage12} />
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0">
      <Group2 />
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[16px] not-italic relative shrink-0 text-[16px] text-white w-[135px] whitespace-pre-wrap">Budi Santoso</p>
    </div>
  );
}

function NameData3() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[225px]" data-name="Name data">
      <p className="font-['SF_Pro:Semibold',sans-serif] font-[590] leading-[16px] relative shrink-0 text-[14px] text-[rgba(255,255,255,0.8)]" style={{ fontVariationSettings: "'wdth' 100" }}>
        02.
      </p>
      <Frame2 />
    </div>
  );
}

function NameData2() {
  return (
    <div className="content-stretch flex items-center justify-between py-[4px] relative shrink-0 w-full" data-name="Name data">
      <div aria-hidden="true" className="absolute border-0 border-[rgba(255,255,255,0.8)] border-solid inset-0 pointer-events-none" />
      <NameData3 />
      <p className="font-['SF_Pro:Semibold',sans-serif] font-[590] leading-[16px] relative shrink-0 text-[14px] text-[rgba(255,255,255,0.8)]" style={{ fontVariationSettings: "'wdth' 100" }}>
        84%
      </p>
    </div>
  );
}

function Group3() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid items-[start] justify-items-[start] leading-[0] relative shrink-0">
      <div className="col-1 h-[69.12px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[7.68px_21.12px] mask-size-[32px_32px] ml-[-7.68px] mt-[-21.12px] relative row-1 w-[46.08px]" data-name="image 10" style={{ maskImage: `url('${imgImage7}')` }}>
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage10} />
      </div>
      <div className="col-1 h-[59px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[9px_5px] mask-size-[32px_32px] ml-[-9px] mt-[-5px] relative row-1 w-[48px]" data-name="image 2" style={{ maskImage: `url('${imgImage7}')` }}>
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage2} />
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0">
      <Group3 />
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[16px] not-italic relative shrink-0 text-[16px] text-white w-[135px] whitespace-pre-wrap">Thomas Speed</p>
    </div>
  );
}

function NameData5() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[225px]" data-name="Name data">
      <p className="font-['SF_Pro:Semibold',sans-serif] font-[590] leading-[16px] relative shrink-0 text-[14px] text-[rgba(255,255,255,0.8)]" style={{ fontVariationSettings: "'wdth' 100" }}>
        03.
      </p>
      <Frame3 />
    </div>
  );
}

function NameData4() {
  return (
    <div className="content-stretch flex items-center justify-between py-[4px] relative shrink-0 w-full" data-name="Name data">
      <div aria-hidden="true" className="absolute border-0 border-[rgba(255,255,255,0.8)] border-solid inset-0 pointer-events-none" />
      <NameData5 />
      <p className="font-['SF_Pro:Semibold',sans-serif] font-[590] leading-[16px] relative shrink-0 text-[14px] text-[rgba(255,255,255,0.8)]" style={{ fontVariationSettings: "'wdth' 100" }}>
        83%
      </p>
    </div>
  );
}

function Group4() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid items-[start] justify-items-[start] leading-[0] relative shrink-0">
      <div className="col-1 h-[69.12px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[7.68px_21.12px] mask-size-[32px_32px] ml-[-7.68px] mt-[-21.12px] relative row-1 w-[46.08px]" data-name="image 10" style={{ maskImage: `url('${imgImage7}')` }}>
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage10} />
      </div>
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0">
      <Group4 />
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[16px] not-italic relative shrink-0 text-[16px] text-white w-[135px] whitespace-pre-wrap">Andy William</p>
    </div>
  );
}

function NameData7() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[225px]" data-name="Name data">
      <p className="font-['SF_Pro:Semibold',sans-serif] font-[590] leading-[16px] relative shrink-0 text-[14px] text-[rgba(255,255,255,0.8)]" style={{ fontVariationSettings: "'wdth' 100" }}>
        04.
      </p>
      <Frame4 />
    </div>
  );
}

function NameData6() {
  return (
    <div className="content-stretch flex items-center justify-between py-[4px] relative shrink-0 w-full" data-name="Name data">
      <div aria-hidden="true" className="absolute border-0 border-[rgba(255,255,255,0.8)] border-solid inset-0 pointer-events-none" />
      <NameData7 />
      <p className="font-['SF_Pro:Semibold',sans-serif] font-[590] leading-[16px] relative shrink-0 text-[14px] text-[rgba(255,255,255,0.8)]" style={{ fontVariationSettings: "'wdth' 100" }}>
        82%
      </p>
    </div>
  );
}

function Group5() {
  return (
    <div className="col-1 grid-cols-[max-content] grid-rows-[max-content] inline-grid items-[start] justify-items-[start] ml-0 mt-0 relative row-1">
      <div className="col-1 h-[69.12px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[7.68px_21.12px] mask-size-[32px_32px] ml-[-7.68px] mt-[-21.12px] relative row-1 w-[46.08px]" data-name="image 10" style={{ maskImage: `url('${imgImage7}')` }}>
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage10} />
      </div>
      <div className="col-1 h-[63px] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[5px_13px] mask-size-[32px_32px] ml-[-5px] mt-[-13px] relative row-1 w-[42px]" data-name="image 4" style={{ maskImage: `url('${imgImage7}')` }}>
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgImage4} />
      </div>
    </div>
  );
}

function Group() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid items-[start] justify-items-[start] leading-[0] relative shrink-0">
      <Group5 />
    </div>
  );
}

function Frame5() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0">
      <Group />
      <p className="font-['Inter:Semi_Bold',sans-serif] font-semibold leading-[16px] not-italic relative shrink-0 text-[16px] text-white w-[135px] whitespace-pre-wrap">You</p>
    </div>
  );
}

function NameData9() {
  return (
    <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-[225px]" data-name="Name data">
      <p className="font-['SF_Pro:Semibold',sans-serif] font-[590] leading-[16px] relative shrink-0 text-[14px] text-[rgba(255,255,255,0.8)]" style={{ fontVariationSettings: "'wdth' 100" }}>
        05.
      </p>
      <Frame5 />
    </div>
  );
}

function NameData8() {
  return (
    <div className="content-stretch flex items-center justify-between py-[4px] relative shrink-0 w-full" data-name="Name data">
      <NameData9 />
      <p className="font-['SF_Pro:Semibold',sans-serif] font-[590] leading-[16px] relative shrink-0 text-[14px] text-[rgba(255,255,255,0.8)]" style={{ fontVariationSettings: "'wdth' 100" }}>
        81%
      </p>
    </div>
  );
}

function ParticipantList() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-name="Participant list">
      <NameData />
      <NameData2 />
      <NameData4 />
      <NameData6 />
      <NameData8 />
    </div>
  );
}

function Frame6() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start py-[16px] relative shrink-0 w-[326.55px]">
      <div className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-end leading-[0] relative shrink-0 text-[16px] text-white w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.2] whitespace-pre-wrap">Participants (25)</p>
      </div>
      <ParticipantList />
    </div>
  );
}

function Content() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[24px] items-center min-h-px min-w-px relative w-full" data-name="Content">
      <Header />
      <BalanceCard />
      <ProgressData />
      <Frame6 />
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

export default function Challenges() {
  return (
    <div className="bg-[#061113] relative size-full" data-name="Challenges">
      <div className="absolute bottom-0 h-[812px] left-1/2 pointer-events-none top-0">
        <BarsStatusBarIPhoneLight />
      </div>
      <Container />
    </div>
  );
}