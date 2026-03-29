
import { Server, Terminal, Database, Cloud } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { ThreeDevOpsGraphics } from './backgrounds/three/ThreeDevOpsGraphics';
import { SectionWrapper } from './ui/SectionWrapper';
import { SectionHeader } from './ui/SectionHeader';
import { ProjectCard } from './ui/ProjectCard';

const projects = [
  {
    title: 'Automated CI/CD Pipeline',
    description: 'A robust GitHub Actions pipeline for automated testing, building, and deploying containerized applications to Kubernetes clusters.',
    tags: ['GitHub Actions', 'Docker', 'Kubernetes', 'Bash'],
    link: 'https://github.com',
    icon: <Server className="w-6 h-6 text-blue-400" />
  },
  {
    title: 'Infrastructure as Code',
    description: 'Terraform modules to provision scalable AWS infrastructure including VPCs, EKS clusters, and RDS databases with high availability.',
    tags: ['Terraform', 'AWS', 'HCL', 'Python'],
    link: 'https://github.com',
    icon: <Cloud className="w-6 h-6 text-emerald-400" />
  },
  {
    title: 'Monitoring Stack',
    description: 'Prometheus and Grafana setup with custom exporters to monitor application performance and alert on anomalies in real-time.',
    tags: ['Prometheus', 'Grafana', 'Go', 'Alertmanager'],
    link: 'https://github.com',
    icon: <Database className="w-6 h-6 text-purple-400" />
  },
  {
    title: 'CLI Automation Tool',
    description: 'A powerful command-line interface written in Go to automate repetitive developer tasks and streamline local environment setup.',
    tags: ['Go', 'CLI', 'Automation'],
    link: 'https://github.com',
    icon: <Terminal className="w-6 h-6 text-orange-400" />
  }
];

export const DevOpsSection = () => {
  return (
    <SectionWrapper 
      id="devops" 
      className="py-12 md:py-16 bg-gray-950"
      background={
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <ThreeDevOpsGraphics />
            <Environment preset="city" />
          </Canvas>
        </div>
      }
    >
      <SectionHeader 
        title="DevOps & Automation" 
        description="Building reliable infrastructure, automating workflows, and creating tools that empower developers." 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {projects.map((project, index) => (
          <ProjectCard
            key={index}
            title={project.title}
            description={project.description}
            tags={project.tags}
            link={project.link}
            icon={project.icon}
            index={index}
          />
        ))}
      </div>
    </SectionWrapper>
  );
};
