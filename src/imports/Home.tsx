import svgPaths from "./svg-2gts8wf65t";
import imgRectangle6 from "figma:asset/c92ce858c610970c9ceacaa61f2a4aa8318c963d.png";

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

function Avatar() {
  return (
    <div className="content-stretch flex items-center relative shrink-0 size-[50px]" data-name="Avatar">
      <div className="aspect-[54/54] h-full relative rounded-[221.263px] shrink-0">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[221.263px] size-full" src={imgRectangle6} />
      </div>
    </div>
  );
}

function Frame15() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 w-full">
      <p className="font-['SF_Pro:Semibold',sans-serif] font-[590] leading-[1.2] relative shrink-0 text-[22px] text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
        marathonbill
      </p>
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0">
      <p className="font-['SF_Pro:Regular',sans-serif] font-normal leading-[1.2] relative shrink-0 text-[14px] text-[rgba(255,255,255,0.8)] w-full whitespace-pre-wrap" style={{ fontVariationSettings: "'wdth' 100", fontFeatureSettings: "'dlig'" }}>
        Welcome back,
      </p>
      <Frame15 />
    </div>
  );
}

function Frame14() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <Avatar />
      <Frame />
    </div>
  );
}

function Fire() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Fire">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Fire">
          <path d={svgPaths.p305a1d00} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame23() {
  return (
    <div className="bg-[rgba(255,255,255,0.1)] content-stretch flex gap-[4px] items-center px-[8px] py-[4px] relative rounded-[12px] shrink-0">
      <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[14px] text-center text-white whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.2]">3</p>
      </div>
      <Fire />
    </div>
  );
}

function Bell() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Bell">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Bell">
          <path d={svgPaths.p17c25080} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function NotificationIndicator() {
  return <div className="absolute bg-[#ff6a00] left-[70.72px] rounded-[50px] size-[7.875px] top-[10px]" data-name="Notification Indicator" />;
}

function IconBox() {
  return (
    <div className="content-stretch flex gap-[10px] h-[44px] items-center justify-center relative shrink-0" data-name="Icon Box">
      <Frame23 />
      <Bell />
      <NotificationIndicator />
    </div>
  );
}

function TopBar() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="Top Bar">
      <Frame14 />
      <IconBox />
    </div>
  );
}

function Group1() {
  return (
    <div className="relative shrink-0 size-[17.955px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.9551 17.9551">
        <g id="Group 1">
          <path d={svgPaths.p161a1900} fill="var(--fill-0, white)" fillOpacity="0.2" id="Subtract" />
          <path d={svgPaths.p25608200} fill="var(--fill-0, white)" id="Subtract_2" />
        </g>
      </svg>
    </div>
  );
}

function Frame16() {
  return (
    <div className="bg-[rgba(255,255,255,0.05)] content-stretch flex flex-col gap-[1.89px] items-center py-[3.78px] relative rounded-[5.67px] shrink-0 w-[39.69px]">
      <Group1 />
      <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] min-w-full relative shrink-0 text-[7.56px] text-center text-white w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.2] whitespace-pre-wrap">Mon</p>
      </div>
      <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] min-w-full relative shrink-0 text-[6.615px] text-center text-white w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.2] whitespace-pre-wrap">26</p>
      </div>
    </div>
  );
}

function Group2() {
  return (
    <div className="relative shrink-0 size-[17.955px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.9551 17.9551">
        <g id="Group 1">
          <path d={svgPaths.pbb0400} fill="var(--fill-0, white)" fillOpacity="0.2" id="Subtract" />
          <path d={svgPaths.p30bf1400} fill="var(--fill-0, white)" id="Subtract_2" />
        </g>
      </svg>
    </div>
  );
}

function Frame17() {
  return (
    <div className="bg-[rgba(255,255,255,0.05)] content-stretch flex flex-col gap-[1.89px] items-center py-[3.78px] relative rounded-[5.67px] shrink-0 w-[39.69px]">
      <Group2 />
      <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] min-w-full relative shrink-0 text-[7.56px] text-center text-white w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.2] whitespace-pre-wrap">Tue</p>
      </div>
      <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] min-w-full relative shrink-0 text-[6.615px] text-center text-white w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.2] whitespace-pre-wrap">27</p>
      </div>
    </div>
  );
}

function Group3() {
  return (
    <div className="relative shrink-0 size-[17.955px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.9551 17.9551">
        <g id="Group 1">
          <path d={svgPaths.p339dcb00} fill="var(--fill-0, white)" fillOpacity="0.2" id="Subtract" />
          <path d={svgPaths.p3e083400} fill="var(--fill-0, white)" id="Subtract_2" />
        </g>
      </svg>
    </div>
  );
}

function Frame19() {
  return (
    <div className="bg-[rgba(255,255,255,0.05)] content-stretch flex flex-col gap-[1.89px] items-center py-[3.78px] relative rounded-[5.67px] shrink-0 w-[39.69px]">
      <Group3 />
      <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] min-w-full relative shrink-0 text-[7.56px] text-center text-white w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.2] whitespace-pre-wrap">Wed</p>
      </div>
      <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] min-w-full relative shrink-0 text-[6.615px] text-center text-white w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.2] whitespace-pre-wrap">28</p>
      </div>
    </div>
  );
}

function Group4() {
  return (
    <div className="relative shrink-0 size-[17.955px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.9551 17.9551">
        <g id="Group 1">
          <path d={svgPaths.p5db9e40} fill="var(--fill-0, white)" fillOpacity="0.2" id="Subtract" />
          <path d={svgPaths.p3d4e7dc0} fill="var(--fill-0, white)" id="Subtract_2" />
        </g>
      </svg>
    </div>
  );
}

function Frame20() {
  return (
    <div className="bg-[rgba(255,255,255,0.05)] content-stretch flex flex-col gap-[1.89px] items-center py-[3.78px] relative rounded-[5.67px] shrink-0 w-[39.69px]">
      <Group4 />
      <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] min-w-full relative shrink-0 text-[7.56px] text-center text-white w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.2] whitespace-pre-wrap">Thu</p>
      </div>
      <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] min-w-full relative shrink-0 text-[6.615px] text-center text-white w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.2] whitespace-pre-wrap">29</p>
      </div>
    </div>
  );
}

function Group5() {
  return (
    <div className="relative shrink-0 size-[17.955px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.9551 17.9551">
        <g id="Group 1">
          <path d={svgPaths.pbb0400} fill="var(--fill-0, #0B0E14)" id="Subtract" />
          <path d={svgPaths.p2b7ae00} fill="var(--fill-0, #FF6A00)" id="Subtract_2" />
        </g>
      </svg>
    </div>
  );
}

function Frame21() {
  return (
    <div className="bg-white content-stretch flex flex-col gap-[1.89px] items-center py-[3.78px] relative rounded-[5.67px] shrink-0 w-[39.69px]">
      <Group5 />
      <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] min-w-full relative shrink-0 text-[#0b0e14] text-[7.56px] text-center w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.2] whitespace-pre-wrap">Fri</p>
      </div>
      <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] min-w-full relative shrink-0 text-[#0b0e14] text-[6.615px] text-center w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.2] whitespace-pre-wrap">30</p>
      </div>
    </div>
  );
}

function Group6() {
  return (
    <div className="relative shrink-0 size-[17.955px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.9551 17.9551">
        <g id="Group 1">
          <path d={svgPaths.p339dcb00} fill="var(--fill-0, white)" fillOpacity="0.2" id="Subtract" />
        </g>
      </svg>
    </div>
  );
}

function Frame22() {
  return (
    <div className="bg-[rgba(255,255,255,0.05)] content-stretch flex flex-col gap-[1.89px] items-center py-[3.78px] relative rounded-[5.67px] shrink-0 w-[39.69px]">
      <Group6 />
      <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] min-w-full relative shrink-0 text-[7.56px] text-center text-white w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.2] whitespace-pre-wrap">Sat</p>
      </div>
      <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] min-w-full relative shrink-0 text-[6.615px] text-center text-white w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.2] whitespace-pre-wrap">31</p>
      </div>
    </div>
  );
}

function Group7() {
  return (
    <div className="relative shrink-0 size-[17.955px]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17.9551 17.9551">
        <g id="Group 1">
          <path d={svgPaths.p5db9e40} fill="var(--fill-0, white)" fillOpacity="0.2" id="Subtract" />
        </g>
      </svg>
    </div>
  );
}

function Frame24() {
  return (
    <div className="bg-[rgba(255,255,255,0.05)] content-stretch flex flex-col gap-[1.89px] items-center py-[3.78px] relative rounded-[5.67px] shrink-0 w-[39.69px]">
      <Group7 />
      <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] min-w-full relative shrink-0 text-[7.56px] text-center text-white w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.2] whitespace-pre-wrap">Sun</p>
      </div>
      <div className="flex flex-col font-['SF_Pro:Regular',sans-serif] font-normal justify-center leading-[0] min-w-full relative shrink-0 text-[6.615px] text-center text-white w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.2] whitespace-pre-wrap">1</p>
      </div>
    </div>
  );
}

function Frame18() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
      <Frame16 />
      <Frame17 />
      <Frame19 />
      <Frame20 />
      <Frame21 />
      <Frame22 />
      <Frame24 />
    </div>
  );
}

function Fire1() {
  return (
    <div className="-translate-x-1/2 absolute left-[calc(50%+0.1px)] size-[16px] top-[34px]" data-name="Fire">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Fire">
          <path d={svgPaths.p305a1d00} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame27() {
  return (
    <div className="col-1 content-stretch flex flex-col items-start ml-[18.63px] mt-[16.28px] relative row-1">
      <div className="flex flex-col font-['SF_Pro:Bold',sans-serif] font-bold justify-center leading-[0] min-w-full relative shrink-0 text-[14px] text-center text-white w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.2] whitespace-pre-wrap">6</p>
      </div>
      <div className="flex flex-col font-['SF_Pro:Light',sans-serif] font-[274.31500244140625] justify-center leading-[0] relative shrink-0 text-[12px] text-[rgba(255,255,255,0.8)] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.2]">Days</p>
      </div>
      <Fire1 />
    </div>
  );
}

function Group8() {
  return (
    <div className="col-1 h-[64.295px] ml-0 mt-0 relative row-1 w-[64.645px]" data-name="Group">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 64.6448 64.2947">
        <g id="Group">
          <path d={svgPaths.p4e5280} fill="var(--fill-0, white)" fillOpacity="0.2" id="Ellipse" />
          <path d={svgPaths.p14b3a400} fill="var(--fill-0, white)" id="Ellipse_2" />
        </g>
      </svg>
    </div>
  );
}

function Group() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid items-[start] justify-items-[start] leading-[0] relative shrink-0" data-name="Group">
      <Frame27 />
      <Group8 />
    </div>
  );
}

function AutoLayoutVertical1() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start leading-[0] relative shrink-0 w-full" data-name="Auto Layout Vertical">
      <div className="flex flex-col font-['SF_Pro:Semibold',sans-serif] font-[590] justify-center relative shrink-0 text-[16px] text-white w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.2] whitespace-pre-wrap">You’ve been keeping track</p>
      </div>
      <div className="flex flex-col font-['SF_Pro:Light',sans-serif] font-[274.31500244140625] justify-center relative shrink-0 text-[12px] text-[rgba(255,255,255,0.8)] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.2] whitespace-pre-wrap">You’ve completed your plan every day for the past week</p>
      </div>
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

function BalanceCard() {
  return (
    <div className="relative rounded-[16px] shrink-0 w-[326px]" data-name="Balance Card" style={{ backgroundImage: "linear-gradient(104.988deg, rgba(255, 255, 255, 0.5) 0.10239%, rgba(255, 255, 255, 0) 49.898%, rgba(255, 255, 255, 0.5) 99.898%), linear-gradient(90deg, rgb(255, 106, 0) 0%, rgb(255, 106, 0) 100%)" }}>
      <div className="content-stretch flex gap-[16px] items-center overflow-clip px-[16px] py-[24px] relative rounded-[inherit] w-full">
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
        <Group />
        <AutoLayoutVertical />
      </div>
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_-4px_20px_0px_rgba(0,0,0,0.25)]" />
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.1)] border-solid inset-0 pointer-events-none rounded-[16px]" />
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex font-normal gap-[4px] items-center relative shrink-0 text-[13px] text-[rgba(255,255,255,0.6)] tracking-[-0.16px]">
      <p className="font-['SF_Pro:Regular',sans-serif] leading-[1.5] relative shrink-0" style={{ fontVariationSettings: "'wdth' 100" }}>
        Progress:
      </p>
      <p className="font-['Inter:Regular',sans-serif] leading-[0] not-italic relative shrink-0">
        <span className="font-['SF_Pro:Semibold',sans-serif] font-[590] leading-[1.5] text-white" style={{ fontVariationSettings: "'wdth' 100" }}>
          2/7
        </span>
        <span className="font-['SF_Pro:Regular',sans-serif] leading-[1.5]" style={{ fontVariationSettings: "'wdth' 100" }}>{` exercises`}</span>
      </p>
    </div>
  );
}

function Frame26() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
      <div className="flex flex-col font-['SF_Pro:Medium',sans-serif] font-[510] justify-center leading-[0] relative shrink-0 text-[16px] text-center text-white tracking-[-0.32px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[1.55]">Exercise List</p>
      </div>
      <Frame1 />
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex gap-[4px] items-center relative shrink-0">
      <p className="font-['SF_Pro:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[13px] text-[rgba(255,255,255,0.6)] tracking-[-0.16px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        10 exercises
      </p>
      <div className="relative shrink-0 size-[3px]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3 3">
          <circle cx="1.5" cy="1.5" fill="var(--fill-0, white)" fillOpacity="0.4" id="Ellipse 1" r="1.5" />
        </svg>
      </div>
      <p className="font-['SF_Pro:Regular',sans-serif] font-normal leading-[1.5] relative shrink-0 text-[13px] text-[rgba(255,255,255,0.6)] tracking-[-0.16px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        1h 15m
      </p>
    </div>
  );
}

function Frame29() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start justify-center relative shrink-0 w-full">
      <Frame26 />
      <Frame2 />
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

function Frame3() {
  return (
    <div className="bg-[rgba(255,255,255,0.1)] h-[48px] relative rounded-[12px] shrink-0 w-full">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center justify-between px-[16px] py-[8px] relative size-full">
          <ol className="block font-['SF_Pro:Regular',sans-serif] font-normal leading-[0] relative shrink-0 text-[14px] text-white whitespace-nowrap" start="1" style={{ fontVariationSettings: "'wdth' 100" }}>
            <li className="ms-[21px] whitespace-pre-wrap">
              <span className="leading-[1.5]">Jump Squat</span>
            </li>
          </ol>
          <CheckCircle />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.1)] border-solid inset-0 pointer-events-none rounded-[12px]" />
    </div>
  );
}

function Frame28() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 size-[24px]">
      <div className="relative rounded-[75px] shrink-0 size-[19.5px]">
        <div aria-hidden="true" className="absolute border-[#ff6a00] border-[0.75px] border-solid inset-0 pointer-events-none rounded-[75px]" />
      </div>
    </div>
  );
}

function Frame4() {
  return (
    <div className="bg-[rgba(255,255,255,0.1)] relative rounded-tl-[12px] rounded-tr-[12px] shrink-0 w-full">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center justify-between px-[16px] py-[8px] relative w-full">
          <ol className="block font-['SF_Pro:Regular',sans-serif] font-normal leading-[0] relative shrink-0 text-[14px] text-white whitespace-nowrap" start="2" style={{ fontVariationSettings: "'wdth' 100" }}>
            <li className="ms-[21px] whitespace-pre-wrap">
              <span className="leading-[1.5]">Sit Up</span>
            </li>
          </ol>
          <Frame28 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[#ff6a00] border-l border-r border-solid border-t inset-0 pointer-events-none rounded-tl-[12px] rounded-tr-[12px]" />
    </div>
  );
}

function Frame10() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0">
      <p className="font-['TT_Commons:Regular',sans-serif] relative shrink-0 text-[#a1a1aa]">Duration:</p>
      <p className="font-['TT_Commons:Medium',sans-serif] relative shrink-0 text-white">30 minutes</p>
    </div>
  );
}

function Frame11() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0">
      <p className="font-['TT_Commons:Regular',sans-serif] relative shrink-0 text-[#a1a1aa]">Reps:</p>
      <p className="font-['TT_Commons:Medium',sans-serif] relative shrink-0 text-white">115</p>
    </div>
  );
}

function Frame12() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0">
      <p className="font-['TT_Commons:Regular',sans-serif] relative shrink-0 text-[#a1a1aa]">Sets:</p>
      <p className="font-['TT_Commons:Medium',sans-serif] relative shrink-0 text-white">15</p>
    </div>
  );
}

function Frame13() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0">
      <p className="font-['TT_Commons:Regular',sans-serif] relative shrink-0 text-[#a1a1aa]">Exercise:</p>
      <p className="font-['TT_Commons:Medium',sans-serif] relative shrink-0 text-white">5</p>
    </div>
  );
}

function Frame5() {
  return (
    <div className="bg-[rgba(255,255,255,0.05)] relative rounded-bl-[12px] rounded-br-[12px] shrink-0 w-full">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center justify-between leading-[normal] not-italic p-[16px] relative text-[14px] w-full">
          <Frame10 />
          <Frame11 />
          <Frame12 />
          <Frame13 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[#ff6a00] border-b border-l border-r border-solid inset-0 pointer-events-none rounded-bl-[12px] rounded-br-[12px]" />
    </div>
  );
}

function Frame6() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <Frame4 />
      <Frame5 />
    </div>
  );
}

function Frame32() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 size-[24px]">
      <div className="relative rounded-[75px] shrink-0 size-[19.5px]">
        <div aria-hidden="true" className="absolute border-[#ff6a00] border-[0.75px] border-solid inset-0 pointer-events-none rounded-[75px]" />
      </div>
    </div>
  );
}

function Frame31() {
  return (
    <div className="bg-[rgba(255,255,255,0.1)] h-[48px] relative rounded-[12px] shrink-0 w-full">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center justify-between px-[16px] py-[8px] relative size-full">
          <ol className="block font-['SF_Pro:Regular',sans-serif] font-normal leading-[0] relative shrink-0 text-[14px] text-white whitespace-nowrap" start="3" style={{ fontVariationSettings: "'wdth' 100" }}>
            <li className="ms-[21px] whitespace-pre-wrap">
              <span className="leading-[1.5]">Sit Up</span>
            </li>
          </ol>
          <Frame32 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.1)] border-solid inset-0 pointer-events-none rounded-[12px]" />
    </div>
  );
}

function Frame34() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 size-[24px]">
      <div className="relative rounded-[75px] shrink-0 size-[19.5px]">
        <div aria-hidden="true" className="absolute border-[#ff6a00] border-[0.75px] border-solid inset-0 pointer-events-none rounded-[75px]" />
      </div>
    </div>
  );
}

function Frame33() {
  return (
    <div className="bg-[rgba(255,255,255,0.1)] h-[48px] relative rounded-[12px] shrink-0 w-full">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center justify-between px-[16px] py-[8px] relative size-full">
          <ol className="block font-['SF_Pro:Regular',sans-serif] font-normal leading-[0] relative shrink-0 text-[14px] text-white whitespace-nowrap" start="4" style={{ fontVariationSettings: "'wdth' 100" }}>
            <li className="ms-[21px] whitespace-pre-wrap">
              <span className="leading-[1.5]">Back Plank</span>
            </li>
          </ol>
          <Frame34 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.1)] border-solid inset-0 pointer-events-none rounded-[12px]" />
    </div>
  );
}

function Frame36() {
  return (
    <div className="content-stretch flex items-center justify-center relative shrink-0 size-[24px]">
      <div className="relative rounded-[75px] shrink-0 size-[19.5px]">
        <div aria-hidden="true" className="absolute border-[#ff6a00] border-[0.75px] border-solid inset-0 pointer-events-none rounded-[75px]" />
      </div>
    </div>
  );
}

function Frame35() {
  return (
    <div className="bg-[rgba(255,255,255,0.1)] h-[48px] relative rounded-[12px] shrink-0 w-full">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex items-center justify-between px-[16px] py-[8px] relative size-full">
          <ol className="block font-['SF_Pro:Regular',sans-serif] font-normal leading-[0] relative shrink-0 text-[14px] text-white whitespace-nowrap" start="5" style={{ fontVariationSettings: "'wdth' 100" }}>
            <li className="ms-[21px] whitespace-pre-wrap">
              <span className="leading-[1.5]">Mountain Climber</span>
            </li>
          </ol>
          <Frame36 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(255,255,255,0.1)] border-solid inset-0 pointer-events-none rounded-[12px]" />
    </div>
  );
}

function Frame30() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
      <Frame29 />
      <Frame3 />
      <Frame6 />
      <Frame31 />
      <Frame33 />
      <Frame35 />
    </div>
  );
}

function Frame25() {
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
      <TopBar />
      <Frame18 />
      <BalanceCard />
      <Frame30 />
      <Frame25 />
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
          <path d={svgPaths.p37582e00} fill="var(--fill-0, white)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame7() {
  return (
    <div className="content-stretch flex flex-[1_0_0] h-full items-center justify-center min-h-px min-w-px relative rounded-[13px]" style={{ backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 100%), linear-gradient(90deg, rgb(255, 106, 0) 0%, rgb(255, 106, 0) 100%)" }}>
      <HouseSimple />
    </div>
  );
}

function Target() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Target">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Target">
          <path d={svgPaths.p2fc49e00} fill="var(--fill-0, white)" fillOpacity="0.5" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Frame8() {
  return (
    <div className="content-stretch flex flex-[1_0_0] h-full items-center justify-center min-h-px min-w-px relative">
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

function Frame9() {
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
      <Frame7 />
      <Frame8 />
      <Frame9 />
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

export default function Home() {
  return (
    <div className="bg-[#061113] relative size-full" data-name="Home">
      <div className="absolute bottom-0 h-[812px] left-1/2 pointer-events-none top-0">
        <BarsStatusBarIPhoneLight />
      </div>
      <Container />
      <Navbar />
    </div>
  );
}