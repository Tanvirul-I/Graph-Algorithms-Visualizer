import React from "react";

interface AlgorithmSelectorProps {
	algorithms: string[];
	onSelectAlgorithm: (algorithmName: string) => void;
}

const AlgorithmSelector: React.FC<AlgorithmSelectorProps> = ({
	algorithms,
	onSelectAlgorithm,
}) => {
	return (
		<select onChange={(e) => onSelectAlgorithm(e.target.value)}>
			<option value="">Select Algorithm</option>
			{algorithms.map((name) => (
				<option
					key={name}
					value={name}
				>
					{name}
				</option>
			))}
		</select>
	);
};

export default AlgorithmSelector;
