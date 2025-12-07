function WelcomePage({ user, onOpenPeople, onOpenGroups }) {
  return (
    <div
      className="flex-1 flex items-center justify-center w-full min-h-[calc(100vh-70px)]"
      style={{
        backgroundImage:
          "url('https://img.freepik.com/free-vector/futuristic-background-design_23-2148503793.jpg?semt=ais_hybrid&w=740&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay for readability */}
      <div className="w-full h-full bg-black/40 flex justify-center items-center px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-10 w-full py-10">

          {/* LEFT IMAGE WITH ANIMATION */}
          <div className="w-full md:w-1/2 animate-slideLeft">
            <img
              src="https://media.licdn.com/dms/image/v2/C4D12AQEsfktkLj-6ww/article-cover_image-shrink_600_2000/article-cover_image-shrink_600_2000/0/1618311227260?e=1766620800&v=beta&t=pCZJhe2CZYskdWqsyYTzFUO9WFkYEqyuMYgC11APC9s"
              alt="People collaborating and chatting"
              className="rounded-xl shadow-lg w-full h-full object-cover"
            />
          </div>

          {/* RIGHT CONTENT WITH ANIMATION */}
          <div className="w-full md:w-1/2 text-center md:text-left animate-slideRight text-white">
            <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-purple-500 to-pink-500 text-transparent bg-clip-text">
              ChatConnect
            </h1>

            <p className="mb-6 text-lg opacity-90">
              A simple place where you can chat one-to-one and in groups,
              stay connected, and share ideas in real time.
            </p>

            {/* BUTTONS */}
            <div className="flex flex-wrap gap-4 justify-center md:justify-start mt-4">
              <button
                type="button"
                onClick={onOpenPeople}
                className="btn btn-primary btn-md transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                People
              </button>

              <button
                type="button"
                onClick={onOpenGroups}
                className="btn btn-secondary btn-md transform transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                Groups
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ANIMATION KEYFRAMES */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes slideRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .animate-fadeIn {
          animation: fadeIn 1s ease-in-out forwards;
        }

        .animate-slideLeft {
          animation: slideLeft 1s ease-out forwards;
        }

        .animate-slideRight {
          animation: slideRight 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default WelcomePage;
