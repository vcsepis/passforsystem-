package buildpacks

import (
	"github.com/google/go-github/github"
)

type goRuntime struct{}

func NewGoRuntime() Runtime {
	return &goRuntime{}
}

func (runtime *goRuntime) Detect(
	client *github.Client,
	directoryContent []*github.RepositoryContent,
	owner, name, path string,
	repoContentOptions github.RepositoryContentGetOptions,
	paketo, heroku *BuilderInfo,
) error {
	paketoBuildpackInfo := BuildpackInfo{
		Name:      "Go",
		Buildpack: "gcr.io/paketo-buildpacks/go",
	}
	herokuBuildpackInfo := BuildpackInfo{
		Name:      "Go",
		Buildpack: "heroku/go",
	}

	gopkgFound := false
	goVendorFound := false
	goModFound := false
	for i := range directoryContent {
		name := directoryContent[i].GetName()
		contentType := directoryContent[i].GetType()
		if name == "Gopkg.toml" {
			gopkgFound = true
			break
		} else if name == "vendor" && contentType == "dir" {
			goVendorFound = true
			break
		} else if name == "go.mod" {
			goModFound = true
			break
		}
	}

	if gopkgFound || goVendorFound || goModFound {
		paketo.Detected = append(paketo.Detected, paketoBuildpackInfo)
		heroku.Detected = append(heroku.Detected, herokuBuildpackInfo)
		return nil
	}

	paketo.Others = append(paketo.Others, paketoBuildpackInfo)
	heroku.Others = append(heroku.Others, herokuBuildpackInfo)
	return nil
}
