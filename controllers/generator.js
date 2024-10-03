import { promises as fsPromises } from "fs";
import fs from "fs";
import path from "path";
import archiver from "archiver";

export const generateJavaCode = async (req, res, next) => {
  let tempDir = "";
  let zipFilePath = "";

  try {
    tempDir = path.join(process.cwd(), "temp", "generated_classes");
    await fsPromises.mkdir(tempDir, { recursive: true });

    for (const classInfo of req.body.classes) {
      const { id, name, attributes, methods } = classInfo;
      const className = capitalizeFirstLetter(name[0]); // Take the first element of the name array
      const packageName = name[0].toLowerCase();

      const classDir = path.join(tempDir, packageName);
      await fsPromises.mkdir(classDir, { recursive: true });

      await generateModelFile(classDir, className, attributes, methods);
      await generateRepositoryFile(classDir, className);
      await generateServiceFile(classDir, className);
      await generateControllerFile(classDir, className);
    }

    zipFilePath = await compressFiles(tempDir, "generated_classes");

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=generated_classes.zip"
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
    console.error("Error generating Java code:", error);
    res.status(500).send("Error generating Java code");

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

const generateModelFile = async (dir, className, attributes, methods) => {
  const content = `
package com.example.${className.toLowerCase()}.model;

import javax.persistence.*;

@Entity
@Table(name = "${className.toLowerCase()}")
public class Model${className} {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    ${attributes
      .map((attr) => {
        const [name, type] = attr
          .substring(2)
          .split(":")
          .map((s) => s.trim());
        return `private ${mapType(type)} ${name};`;
      })
      .join("\n    ")}

    ${methods
      .map((method) => {
        const [name, returnType] = method
          .substring(2)
          .split(":")
          .map((s) => s.trim());
        const methodName = name.split("(")[0];
        return `public ${mapType(
          returnType
        )} ${methodName}() {\n        // TODO: Implement method\n    }`;
      })
      .join("\n\n    ")}

    // Getters and Setters
}
`;
  await fsPromises.writeFile(path.join(dir, `Model${className}.java`), content);
};

const generateRepositoryFile = async (dir, className) => {
  const content = `
package com.example.${className.toLowerCase()}.repository;

import com.example.${className.toLowerCase()}.model.Model${className};
import org.springframework.data.jpa.repository.JpaRepository;

public interface Repository${className} extends JpaRepository<Model${className}, Long> {
}
`;
  await fsPromises.writeFile(
    path.join(dir, `Repository${className}.java`),
    content
  );
};

const generateServiceFile = async (dir, className) => {
  const content = `
package com.example.${className.toLowerCase()}.service;

import com.example.${className.toLowerCase()}.model.Model${className};
import com.example.${className.toLowerCase()}.repository.Repository${className};
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class Service${className} {

    @Autowired
    private Repository${className} repository;

    public List<Model${className}> findAll() {
        return repository.findAll();
    }

    public Optional<Model${className}> findById(Long id) {
        return repository.findById(id);
    }

    public Model${className} save(Model${className} ${className.toLowerCase()}) {
        return repository.save(${className.toLowerCase()});
    }

    public void deleteById(Long id) {
        repository.deleteById(id);
    }
}
`;
  await fsPromises.writeFile(
    path.join(dir, `Service${className}.java`),
    content
  );
};

const generateControllerFile = async (dir, className) => {
  const content = `
package com.example.${className.toLowerCase()}.controller;

import com.example.${className.toLowerCase()}.model.Model${className};
import com.example.${className.toLowerCase()}.service.Service${className};
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/${className.toLowerCase()}")
public class Controller${className} {

    @Autowired
    private Service${className} service;

    @GetMapping
    public List<Model${className}> getAll${className}s() {
        return service.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Model${className}> get${className}ById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Model${className} create${className}(@RequestBody Model${className} ${className.toLowerCase()}) {
        return service.save(${className.toLowerCase()});
    }

    @PutMapping("/{id}")
    public ResponseEntity<Model${className}> update${className}(@PathVariable Long id, @RequestBody Model${className} ${className.toLowerCase()}) {
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
}
`;
  await fsPromises.writeFile(
    path.join(dir, `Controller${className}.java`),
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

const mapType = (type) => {
  switch (type.toLowerCase()) {
    case "number":
      return "Double";
    case "string":
      return "String";
    case "boolean":
      return "Boolean";
    case "undefined":
      return "void";
    default:
      return type; // Return the original type if not recognized
  }
};
