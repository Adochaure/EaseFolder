import { ImagesBadge } from "@/components/ui/images-badge";
import Navbar from "@/components/ui/navbar";

export default function Home() {
  const steps = [
    {
      number: "01",
      title: "Describe your project",
      description:
        "Write a short prompt about the app, website, or folder structure you want. The clearer the input, the better the result.",
    },
    {
      number: "02",
      title: "Choose a structure",
      description:
        "Pick a starter template or let EaseFolder generate a custom layout for you. You can preview the tree before downloading.",
    },
    {
      number: "03",
      title: "Refine the folders",
      description:
        "Add, rename, or remove files and folders until it matches your workflow. Everything stays easy to edit.",
    },
    {
      number: "04",
      title: "Export and ship",
      description:
        "Download the structure as a ZIP or send it directly to GitHub so you can start building immediately.",
    },
  ];

  return (
    <div className="min-h-screen px-3 py-2 sm:px-6 lg:px-8">
      <Navbar isLightMode={true} />
      <main className="relative mx-auto flex min-h-[calc(100vh-1rem)] max-w-4xl flex-col border-dotted border-[#dad8d8] px-4 pb-4 pt-24 sm:px-6 sm:pt-28 md:border-x">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center sm:gap-4">
          <h1 className="font-heading text-3xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            Build Your Project Folder Structure in Seconds
          </h1>
          <p className="max-w-xl text-xs text-white/90 sm:text-sm lg:text-base">
            Generate your project structure with AI - download it as a ZIP or
            push it directly to GitHub.
          </p>
          <a
            href="#create"
            className="flex items-center justify-center rounded-xl bg-[#fffefd] px-4 py-3 text-sm font-medium text-black transition duration-200 hover:bg-[#99f3f9] lg:hidden"
          >
            <span className="text-shimmer">Create Project</span>
          </a>
        </div>
        <div className="flex justify-center pb-0">
          <ImagesBadge
            text="EaseFolder"
            images={[
              "https://skillicons.dev/icons?i=js",
              "https://skillicons.dev/icons?i=css",
              "https://skillicons.dev/icons?i=html",
            ]}
            className="translate-y-1 scale-[0.78] sm:scale-75 md:scale-90 lg:scale-100"
          />
        </div>
      </main>
      <section
        id="how-it-works"
        className="mx-auto min-h-screen max-w-4xl border-dotted border-[#dad8d8] px-4 py-10 sm:px-6 md:border-x"
      >
        <div className="flex h-full flex-col border-dotted border-[#dad8d8] py-10 md:border-x">
          <div className="px-2 sm:px-6">
            <p className="text-xs uppercase tracking-[0.35em] text-[rgba(0,114,143,1)]/80">
              How to use
            </p>
            <h2 className="mt-3 font-heading text-3xl font-bold text-[rgba(0,114,143,1)] sm:text-5xl">
              Follow these steps to build your folder structure
            </h2>
          </div>

          <div className="mt-10 flex flex-1 flex-col px-0">
            {steps.map((step, index) => {
              const isLeft = index % 2 === 0;

              return (
                <div
                  key={step.number}
                  className="grid min-h-[180px] grid-cols-1 border border-dotted border-[rgba(0,114,143,0.7)] md:min-h-[260px] md:grid-cols-2"
                >
                  <div
                    className={`flex items-center justify-center border-dotted border-[rgba(0,114,143,0.7)] p-6 md:border-r md:p-10 ${
                      isLeft
                        ? "border-b md:border-b-0"
                        : "md:order-2 md:border-l md:border-r-0"
                    }`}
                  >
                    <div className="flex h-24 w-24 items-center justify-center text-5xl font-semibold text-[rgba(0,114,143,1)] sm:h-32 sm:w-32 sm:text-7xl">
                      {step.number}
                    </div>
                  </div>

                  <div
                    className={`flex flex-col justify-center border-dotted border-[rgba(0,114,143,0.7)] p-6 md:p-10 ${
                      isLeft
                        ? "md:border-l"
                        : "border-t md:order-1 md:border-t-0 md:border-r"
                    }`}
                  >
                    <p className="text-xs uppercase tracking-[0.3em] text-[rgba(0,114,143,1)]/90 sm:hidden">
                      Step {step.number}
                    </p>
                    <h3 className="font-heading text-2xl font-bold text-white sm:mt-0 sm:text-4xl">
                      {step.title}
                    </h3>
                    <p className="mt-4 max-w-xl text-sm leading-7 text-white/80 sm:text-base">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
