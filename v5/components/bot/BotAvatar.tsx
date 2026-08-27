// The mascot. One hand-authored inline SVG, drawn from `public/assets/bot_icon.jpeg`:
// round head, two tipped antennae, rounded visor with curved-smile eyes, striped mouth,
// two stubby feet — re-cut in v5's language with a 3-unit ink stroke on every shape.
//
// WHY NOT SVGATOR: an exported SVGator file bakes its colours in and cannot read `var(--pop)`
// off the theme root, so it would freeze on one palette while the live control panel re-skins
// everything around it. Every fill and stroke here is a CSS custom property, and there is not
// a single literal hex in this file — nor any fragment-id reference, which is why the mouth
// stripes are plain lines rather than a fill behind a clip path.
//
// Motion is entirely CSS keyframes in `globals.css`, keyed off `data-state`. No JS, no rAF,
// no runtime cost, and all of it gated behind `prefers-reduced-motion: reduce`.

export type BotState = "idle" | "thinking" | "speaking" | "deflecting";

/** badge 40px · header 28px · message 22px — the three sizes the widget uses. */
export type BotAvatarSize = "badge" | "head" | "msg";

type Props = {
  state?: BotState;
  size?: BotAvatarSize;
  className?: string;
};

const LABEL: Record<BotState, string> = {
  idle: "Glaze-Bot",
  thinking: "Glaze-Bot is thinking",
  speaking: "Glaze-Bot is replying",
  deflecting: "Glaze-Bot is dodging that one",
};

export default function BotAvatar({ state = "idle", size = "head", className }: Props) {
  return (
    <svg
      className={`bot-avatar bot-avatar--${size}${className ? ` ${className}` : ""}`}
      data-state={state}
      viewBox="0 0 64 64"
      role="img"
      aria-label={LABEL[state]}
      focusable="false"
    >
      {/* One group so the bob and the deflect tilt move the whole robot together. */}
      <g className="ba-body">
        <g className="ba-ant ba-ant--l">
          <path className="ba-ant-stem" d="M20 18 L11.5 7.5" />
          <circle className="ba-tip" cx="9" cy="5.5" r="3.6" />
        </g>
        <g className="ba-ant ba-ant--r">
          <path className="ba-ant-stem" d="M44 18 L52.5 7.5" />
          <circle className="ba-tip" cx="55" cy="5.5" r="3.6" />
        </g>

        <circle className="ba-head" cx="32" cy="34" r="21" />

        {/* Raised eyebrow — invisible except in the deflecting state. */}
        <path className="ba-brow" d="M35 19.2 q4.5 -3.4 9 -0.8" />

        <rect className="ba-visor" x="15" y="23" width="34" height="15" rx="7.5" />
        <g className="ba-eyes">
          <path className="ba-eye" d="M22 31.8 a4 4 0 0 1 8 0" />
          <path className="ba-eye" d="M34 31.8 a4 4 0 0 1 8 0" />
        </g>

        <g className="ba-mouth">
          <rect className="ba-mouth-plate" x="21" y="42" width="22" height="9" rx="4.5" />
          <path className="ba-stripe ba-stripe--1" d="M27 43.4 L27 49.6" />
          <path className="ba-stripe ba-stripe--2" d="M32 43.1 L32 49.9" />
          <path className="ba-stripe ba-stripe--3" d="M37 43.4 L37 49.6" />
        </g>

        <rect className="ba-foot" x="10" y="51" width="17" height="9" rx="4.5" />
        <rect className="ba-foot" x="37" y="51" width="17" height="9" rx="4.5" />
      </g>
    </svg>
  );
}
