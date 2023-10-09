import classnames from "classnames";
import { motion } from "framer-motion";
import React from "react";
import { IconContext } from "react-icons";
import { AiFillGithub, AiFillLinkedin } from "react-icons/ai";

const TicTacTwo: React.FC = () => {
  return (
    <div className="flex justify-center items-center">
      <header className="flex fixed top-0 h-10 w-full items-center justify-end shadow-2xl backdrop:blur-lg ">
        <IconContext.Provider value={{ size: "2rem" }}>
          <div className="flex items-center justify-center space-x-2">
            <motion.a
              whileHover={{ opacity: 0.5, scale: 0.9, cursor: "pointer" }}
              transition={{ duration: 0.5 }}
              whileTap={{ scale: 1.4 }}
              href="https://github.com/AJ4200"
            >
              <AiFillGithub />
            </motion.a>
            <motion.a
              whileHover={{ opacity: 0.5, scale: 0.9, cursor: "pointer" }}
              transition={{ duration: 0.5 }}
              whileTap={{ scale: 1.4 }}
              href="https://www.linkedin.com/in/abel-majadibodu-5a0583193/"
            >
              <AiFillLinkedin />
            </motion.a>
          </div>
        </IconContext.Provider>
      </header>
      <div className="flex flex-col items-center">
        <h1>
          <span>Tic-</span>
          <span>Tac</span>
          <span>-Two</span>
        </h1>
        <motion.span
          className="relative bg-transparent text-lg inline-block"
          initial={{ y: 0 }}
          animate={{ y: [10, -10, 10] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          Comming Soon
        </motion.span>
        <motion.a
          href="https://github.com/AJ4200/Tic-Tac-Two"
          whileHover={{ scale: 0.95 }}
          whileTap={{ scale: 1.1 }}
          className={classnames(
            "cursor-pointer custome-shadow text-transparent",
            "mt-16 p-2 border-none rounded-full"
          )}
        >
          Become a contributor
        </motion.a>
        <motion.a
          href="https://tic-tac-two-demo.vercel.app/"
          whileHover={{ scale: 0.95 }}
          whileTap={{ scale: 1.1 }}
          className={classnames(
            "cursor-pointer custome-shadow text-transparent",
            "mt-16 p-2 border-none rounded-full"
          )}
        >
          Try Dev Demo
        </motion.a>
      </div>
      <span className="fixed bottom-1 text-sm">Project By AJ4200 © 2023</span>
    </div>
  );
};

export default TicTacTwo;
