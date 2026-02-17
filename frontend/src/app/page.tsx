// @TASK P0-T0.2 - Frontend 초기화: Home Page

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4">AI System</h1>
        <p className="text-lg text-muted-foreground">
          Team & Task Management Platform
        </p>
      </div>
    </main>
  );
}
