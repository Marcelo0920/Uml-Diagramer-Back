import { promises as fsPromises } from "fs";
import fs from "fs";
import path from "path";
import archiver from "archiver";

export const generateSpringBootProject = async (req, res, next) => {
  let tempDir = "";
  let zipFilePath = "";

  try {
    const projectName = req.body.projectName || "demo";
    const packageName = req.body.packageName || "com.example.demo";

    tempDir = path.join(process.cwd(), "temp", projectName);
    await fsPromises.mkdir(tempDir, { recursive: true });

    // Generate project structure
    await generateProjectStructure(tempDir, packageName);

    // Generate pom.xml
    await generatePomXml(tempDir, projectName, packageName);

    // Generate application.properties
    await generateApplicationProperties(tempDir);

    // Generate main application class
    await generateMainClass(tempDir, packageName, projectName);

    for (const classInfo of req.body.classes) {
      const { name, attributes, methods } = classInfo;
      const className = capitalizeFirstLetter(name[0]);
      const classPackage = `${packageName}`;

      const modelDir = path.join(
        tempDir,
        "src",
        "main",
        "java",
        ...classPackage.split("."),
        "model"
      );
      const repositoryDir = path.join(
        tempDir,
        "src",
        "main",
        "java",
        ...classPackage.split("."),
        "repository"
      );
      const serviceDir = path.join(
        tempDir,
        "src",
        "main",
        "java",
        ...classPackage.split("."),
        "service"
      );
      const controllerDir = path.join(
        tempDir,
        "src",
        "main",
        "java",
        ...classPackage.split("."),
        "controller"
      );

      await fsPromises.mkdir(modelDir, { recursive: true });
      await fsPromises.mkdir(repositoryDir, { recursive: true });
      await fsPromises.mkdir(serviceDir, { recursive: true });
      await fsPromises.mkdir(controllerDir, { recursive: true });

      await generateModelFile(
        modelDir,
        className,
        attributes,
        methods,
        classPackage
      );
      await generateRepositoryFile(repositoryDir, className, classPackage);
      await generateServiceFile(serviceDir, className, classPackage);
      await generateControllerFile(controllerDir, className, classPackage);
    }

    zipFilePath = await compressFiles(tempDir, projectName);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${projectName}.zip`
    );

    const fileStream = fs.createReadStream(zipFilePath);
    fileStream.pipe(res);

    fileStream.on("end", () => {
      // Clean up temp directory and zip file after sending
      fsPromises
        .rm(tempDir, { recursive: true, force: true })
        .catch(console.error);
      fsPromises.unlink(zipFilePath).catch(console.error);
    });
  } catch (error) {
    console.error("Error generating Spring Boot project:", error);
    res.status(500).send("Error generating Spring Boot project");

    // Clean up in case of error
    if (tempDir) {
      fsPromises
        .rm(tempDir, { recursive: true, force: true })
        .catch(console.error);
    }
    if (zipFilePath) {
      fsPromises.unlink(zipFilePath).catch(console.error);
    }
  }
};

const generateProjectStructure = async (projectDir, packageName) => {
  const dirs = [
    "src/main/java",
    "src/main/resources",
    "src/test/java",
    "src/test/resources",
  ];

  for (const dir of dirs) {
    await fsPromises.mkdir(path.join(projectDir, dir), { recursive: true });
  }

  // Create package structure
  const packagePath = path.join(
    projectDir,
    "src",
    "main",
    "java",
    ...packageName.split(".")
  );
  await fsPromises.mkdir(packagePath, { recursive: true });
};

const generatePomXml = async (projectDir, projectName, packageName) => {
  const content = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.5.5</version>
        <relativePath/>
    </parent>
    <groupId>${packageName}</groupId>
    <artifactId>${projectName}</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>${projectName}</name>
    <description>Demo project for Spring Boot</description>
    <properties>
        <java.version>11</java.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>`;

  await fsPromises.writeFile(path.join(projectDir, "pom.xml"), content);
};

const generateApplicationProperties = async (projectDir) => {
  const content = `spring.datasource.url=your db url
spring.datasource.username=your db user name
spring.datasource.password=your db password
spring.datasource.driver-class-name=org.postgresql.Driver
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=update`;

  await fsPromises.writeFile(
    path.join(projectDir, "src", "main", "resources", "application.properties"),
    content
  );
};

const generateMainClass = async (projectDir, packageName, projectName) => {
  const className = `${capitalizeFirstLetter(projectName)}Application`;
  const content = `package ${packageName};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ${className} {

    public static void main(String[] args) {
        SpringApplication.run(${className}.class, args);
    }
}`;

  await fsPromises.writeFile(
    path.join(
      projectDir,
      "src",
      "main",
      "java",
      ...packageName.split("."),
      `${className}.java`
    ),
    content
  );
};

const generateModelFile = async (
  dir,
  className,
  attributes,
  methods,
  packageName
) => {
  const content = `package ${packageName}.model;

import javax.persistence.*;

@Entity
@Table(name = "${className.toLowerCase()}")
public class ${className} {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    ${attributes
      .map((attr) => {
        const parts = attr.substring(2).split(":");
        const name = parts[0].trim();
        const type = parts[1] ? parts[1].trim() : "String"; // Default to String if type is not specified
        return `private ${mapType(type)} ${name};`;
      })
      .join("\n    ")}

    ${methods
      .filter((method) => {
        const trimmedMethod = method.trim();
        return trimmedMethod !== "- ()" && trimmedMethod !== "-()";
      })
      .map((method) => {
        const parts = method.substring(2).trim().split(":");
        const methodSignature = parts[0].trim();
        if (!methodSignature) return ""; // Skip if method signature is empty
        const [name, params] = methodSignature.split("(");
        return `public void ${name.trim()}(${params || ")"} {
        // Method stub
    }`;
      })
      .filter((method) => method !== "") // Remove any empty strings from the array
      .join("\n\n    ")}

    // Getters and Setters
    ${generateGettersAndSetters(attributes)}
}`;
  await fsPromises.writeFile(path.join(dir, `${className}.java`), content);
};

const generateRepositoryFile = async (dir, className, packageName) => {
  const content = `package ${packageName}.repository;

import ${packageName}.model.${className};
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ${className}Repository extends JpaRepository<${className}, Long> {
}`;
  await fsPromises.writeFile(
    path.join(dir, `${className}Repository.java`),
    content
  );
};

const generateServiceFile = async (dir, className, packageName) => {
  const content = `package ${packageName}.service;

import ${packageName}.model.${className};
import ${packageName}.repository.${className}Repository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ${className}Service {

    @Autowired
    private ${className}Repository repository;

    public List<${className}> findAll() {
        return repository.findAll();
    }

    public Optional<${className}> findById(Long id) {
        return repository.findById(id);
    }

    public ${className} save(${className} ${className.toLowerCase()}) {
        return repository.save(${className.toLowerCase()});
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}`;
  await fsPromises.writeFile(
    path.join(dir, `${className}Service.java`),
    content
  );
};

const generateControllerFile = async (dir, className, packageName) => {
  const content = `package ${packageName}.controller;

import ${packageName}.model.${className};
import ${packageName}.service.${className}Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/${className.toLowerCase()}")
public class ${className}Controller {

    @Autowired
    private ${className}Service service;

    @GetMapping
    public List<${className}> getAll${className}s() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<${className}> get${className}ById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ${className} create${className}(@RequestBody ${className} ${className.toLowerCase()}) {
        return service.save(${className.toLowerCase()});
    }

    @PutMapping("/{id}")
    public ResponseEntity<${className}> update${className}(@PathVariable Long id, @RequestBody ${className} ${className.toLowerCase()}) {
        return service.findById(id)
                .map(existing${className} -> {
                    // Update existing${className} with ${className.toLowerCase()} fields
                    return ResponseEntity.ok(service.save(existing${className}));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete${className}(@PathVariable Long id) {
        return service.findById(id)
                .map(${className.toLowerCase()} -> {
                    service.deleteById(id);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}`;
  await fsPromises.writeFile(
    path.join(dir, `${className}Controller.java`),
    content
  );
};

const compressFiles = async (sourceDir, zipName) => {
  const zipFilePath = path.join(process.cwd(), `${zipName}.zip`);
  const output = fs.createWriteStream(zipFilePath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on("close", () => resolve(zipFilePath));
    archive.on("error", reject);

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
};

const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const generateGettersAndSetters = (attributes) => {
  return attributes
    .map((attr) => {
      const parts = attr.substring(2).split(":");
      const name = parts[0].trim();
      const type = parts[1] ? mapType(parts[1].trim()) : "String";
      const capitalizedName = capitalizeFirstLetter(name);
      return `
    public ${type} get${capitalizedName}() {
        return ${name};
    }

    public void set${capitalizedName}(${type} ${name}) {
        this.${name} = ${name};
    }`;
    })
    .join("\n");
};

const getDefaultReturnStatement = (returnType) => {
  switch (returnType.toLowerCase()) {
    case "int":
    case "integer":
    case "long":
    case "short":
    case "byte":
      return "return 0;";
    case "float":
    case "double":
      return "return 0.0;";
    case "boolean":
      return "return false;";
    case "char":
      return "return '\\0';";
    case "void":
      return "";
    default:
      return "return null;";
  }
};

const mapType = (type) => {
  if (!type) return "String"; // Default to String if type is undefined or null

  switch (type.toLowerCase()) {
    case "number":
    case "int":
    case "integer":
      return "Integer";
    case "long":
      return "Long";
    case "double":
    case "float":
      return "Double";
    case "string":
      return "String";
    case "boolean":
      return "Boolean";
    case "date":
      return "java.util.Date";
    case "localdatetime":
      return "java.time.LocalDateTime";
    case "localdate":
      return "java.time.LocalDate";
    case "bigdecimal":
      return "java.math.BigDecimal";
    case "void":
      return "void";
    default:
      return type; // Return the original type if not recognized
  }
};
