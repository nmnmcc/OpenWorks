import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { AuthDialog } from "@/components/shared/AuthDialog";
import { PostComposeDialog } from "@/components/shared/PostComposeDialog";
import { Sidebar } from "@/components/Sidebar";
import { Toaster } from "@/components/ui/toast";
import type { ReactNode } from "react";

/**
 * Mobile (<640px)
 * +----------------------------------+
 * | [Header -- sticky top, full w]   |
 * +----------------------------------+
 * |                                  |
 * |  main (flex-1, px-4 py-6)        |
 * |  full width, no sidebar          |
 * |  pb-14 (bottom-nav clearance)    |
 * |                                  |
 * +----------------------------------+
 * | [BottomNav -- fixed bottom]      |
 * | Home|Explore| + |Notif|Profile   |
 * +----------------------------------+
 *
 * Tablet (640-1023px)
 * +------------------------------------------+
 * | [Header -- sticky top, full width]       |
 * +------------------------------------------+
 * |                                          |
 * |  main (flex-1, px-4 py-6)                |
 * |  full width, sidebar still hidden        |
 * |  pb-14 (bottom-nav clearance)            |
 * |                                          |
 * +------------------------------------------+
 * | [BottomNav -- fixed bottom]              |
 * | Home | Explore |  +  | Notif | Profile   |
 * +------------------------------------------+
 *
 * 移动端和平板端底部导航栏（lg:hidden）替代侧栏和汉堡菜单。
 * main 额外增加 pb-14 以防内容被固定定位的底部导航遮挡。
 *
 * Desktop (1024-1535px)
 * +----------------------------------------------------+
 * | [Header -- sticky top, full width, max-w-5xl inner]|
 * +----------------------------------------------------+
 * | Sidebar (w-56) |  main (flex-1, px-4 py-6)         |
 * | shrink-0       |  min-w-0 (eats leftover width,    |
 * | sticky top-14  |  never squeezes sidebar)          |
 * | full height    |                                   |
 * | border-r       |                                   |
 * +----------------+-----------------------------------+
 * | [AuthDialog] [PostComposeDialog] [Toaster]          |
 * +----------------------------------------------------+
 *
 * Ultra-wide (>=1536px)
 * +================================================================+
 * |                       browser viewport                         |
 * |  +----------------------------------------------------------+  |
 * |  | [Header -- sticky top, full width, max-w-5xl inner]      |  |
 * |  +----------------------------------------------------------+  |
 * |  | Sidebar (w-56) |  main (min-w-0 flex-1, px-4 py-6)       |  |
 * |  | shrink-0       |                                         |  |
 * |  | full height    |                                         |  |
 * |  | border-r       |                                         |  |
 * |  +----------------+-----------------------------------------+  |
 * |  | [AuthDialog] [PostComposeDialog] [Toaster]                |  |
 * |  +----------------------------------------------------------+  |
 * |                  ^--- max-w-6xl, mx-auto ---^                  |
 * +================================================================+
 *
 * 与 Desktop 结构一致，但 max-w-6xl (72rem) 封顶总宽度，mx-auto 水平居中。
 * 底部导航栏 lg:hidden，桌面端不显示。
 *
 * max-w-6xl 居中（w-full 必备：body 是 flex column，无它则 mx-auto
 * 取消 stretch、壳容器塌缩为 fit-content）。侧栏固定宽度，lg 以下隐藏。
 * 匿名用户可浏览；登录/注册通过 AuthDialog 弹窗完成；
 * 发帖通过 PostComposeDialog 弹窗完成（atom 控制）。
 * main 设 min-w-0 防止 flex 溢出。
 */
export default function AppLayout({ children }: { readonly children: ReactNode }) {
  return (
    <>
      <Header />
      <div className="mx-auto flex w-full max-w-6xl">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 py-6 max-lg:pb-20">{children}</main>
      </div>
      <BottomNav />
      <AuthDialog />
      <PostComposeDialog />
      <Toaster />
    </>
  );
}
