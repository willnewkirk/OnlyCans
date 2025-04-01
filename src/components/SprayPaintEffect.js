import React, { useEffect, useRef } from 'react';
import '../styles/cursor.css';

const SprayPaintEffect = () => {
  const isSpraying = useRef(false);
  const sprayInterval = useRef(null);
  const sprayContainer = useRef(null);
  const lastMousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Create a container for the spray paint
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '9998';
    document.body.appendChild(container);
    sprayContainer.current = container;

    return () => {
      container.remove();
    };
  }, []);

  const isInteractiveElement = (element) => {
    const interactiveTags = ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'];
    const interactiveRoles = ['button', 'link', 'menuitem', 'tab', 'checkbox', 'radio', 'textbox'];
    
    if (interactiveTags.includes(element.tagName)) return true;
    if (element.getAttribute('role') && interactiveRoles.includes(element.getAttribute('role'))) return true;
    if (element.closest('button, a, input, textarea, select')) return true;
    return false;
  };

  const createSprayParticle = (x, y) => {
    // Check if the target element is interactive
    const targetElement = document.elementFromPoint(x, y);
    if (targetElement && isInteractiveElement(targetElement)) {
      return;
    }

    // Create more particles for a denser effect
    for (let i = 0; i < 15; i++) {
      const particle = document.createElement('div');
      particle.className = 'spray-particle';
      
      // Tighter spread for more concentrated pattern
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 20; // Reduced from 40 to 20 for tighter spread
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      
      // Varied particle sizes
      const size = Math.random() * 2 + 1;
      
      particle.style.left = `${x + tx}px`;
      particle.style.top = `${y + ty}px`;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      // Make all particles temporary with random durations
      particle.classList.add('temporary');
      particle.style.setProperty('--duration', `${Math.random() * 0.5 + 0.3}s`);
      
      if (sprayContainer.current) {
        sprayContainer.current.appendChild(particle);
      }
    }
  };

  const handleMouseDown = (e) => {
    // Check if clicking on an interactive element
    if (isInteractiveElement(e.target)) {
      return;
    }

    isSpraying.current = true;
    lastMousePosition.current = { x: e.clientX, y: e.clientY };
    createSprayParticle(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    isSpraying.current = false;
    if (sprayInterval.current) {
      clearInterval(sprayInterval.current);
      sprayInterval.current = null;
    }
  };

  const handleMouseMove = (e) => {
    if (isSpraying.current) {
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
      createSprayParticle(e.clientX, e.clientY);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
      if (sprayInterval.current) {
        clearInterval(sprayInterval.current);
      }
    };
  }, []);

  return null;
};

export default SprayPaintEffect; 